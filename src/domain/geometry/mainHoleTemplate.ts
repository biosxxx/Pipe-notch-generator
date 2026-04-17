import type { Point2D } from '../../types';
import { dotVec3, scaleVec3, subVec3, type Vec3 } from './vector';
import { findPrimitiveById, type ReceiverTrimOperation, type SolidCylinderPrimitive, type SolidModel } from './solids';

interface MainHoleConfig {
    receiverRadius: number;
    openingTool: SolidCylinderPrimitive;
    penetrationDepth: number;
    mainAxis: Vec3;
    mainNormal: Vec3;
    mainRadialX: Vec3;
    toolAxis: Vec3;
    toolNormal: Vec3;
    toolRadialX: Vec3;
    originDelta: Vec3;
    projectedToolAxis: Vec3;
    projectedToolAxisLengthSq: number;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function projectToPlane(vector: Vec3, planeNormal: Vec3) {
    return subVec3(vector, scaleVec3(planeNormal, dotVec3(vector, planeNormal)));
}

function findReceiverTrim(model: SolidModel): ReceiverTrimOperation | undefined {
    return model.trims.find((trim): trim is ReceiverTrimOperation => trim.kind === 'receiver-profile');
}

function resolveMainHoleConfig(model: SolidModel): MainHoleConfig | { error: string } {
    const main = findPrimitiveById(model, model.outputs.mainPrimitiveId);
    const openingTool = findPrimitiveById(model, model.outputs.openingToolId);
    const receiverTrim = findReceiverTrim(model);

    if (!main || main.kind !== 'hollow-cylinder') {
        return { error: 'SolidModel error: missing main hollow cylinder.' };
    }

    if (!openingTool || openingTool.kind !== 'solid-cylinder') {
        return { error: 'SolidModel error: missing opening tool cylinder.' };
    }

    if (!receiverTrim) {
        return { error: 'SolidModel error: missing receiver-profile trim.' };
    }

    const mainAxis = main.frame.axis;
    const toolAxis = openingTool.frame.axis;
    const projectedToolAxis = projectToPlane(toolAxis, mainAxis);
    const projectedToolAxisLengthSq = dotVec3(projectedToolAxis, projectedToolAxis);

    if (main.outerRadius <= 0 || openingTool.radius <= 0 || projectedToolAxisLengthSq < 1e-9) {
        return { error: 'SolidModel error: invalid main opening configuration.' };
    }

    return {
        receiverRadius: main.outerRadius,
        openingTool,
        penetrationDepth: receiverTrim.penetrationDepth,
        mainAxis,
        mainNormal: main.frame.normal,
        mainRadialX: main.frame.binormal,
        toolAxis,
        toolNormal: openingTool.frame.normal,
        toolRadialX: {
            x: -openingTool.frame.binormal.x,
            y: -openingTool.frame.binormal.y,
            z: -openingTool.frame.binormal.z,
        },
        originDelta: subVec3(openingTool.frame.origin, main.frame.origin),
        projectedToolAxis,
        projectedToolAxisLengthSq,
    };
}

function evaluateOpeningPoint(config: MainHoleConfig, alpha: number): Vec3 | null {
    const radialX = scaleVec3(config.toolRadialX, config.openingTool.radius * Math.cos(alpha));
    const radialY = scaleVec3(config.toolNormal, config.openingTool.radius * Math.sin(alpha));
    const basePoint = {
        x: config.originDelta.x + radialX.x + radialY.x,
        y: config.originDelta.y + radialX.y + radialY.y,
        z: config.originDelta.z + radialX.z + radialY.z,
    };
    const basePointProjected = projectToPlane(basePoint, config.mainAxis);
    const a = config.projectedToolAxisLengthSq;
    const b = 2 * dotVec3(basePointProjected, config.projectedToolAxis);
    const c = dotVec3(basePointProjected, basePointProjected) - (config.receiverRadius ** 2);
    const discriminant = (b ** 2) - (4 * a * c);

    if (discriminant < -0.1) {
        return null;
    }

    const sqrtDiscriminant = Math.sqrt(Math.max(0, discriminant));
    const axial = ((-b + sqrtDiscriminant) / (2 * a)) - config.penetrationDepth;

    return {
        x: basePoint.x + (config.toolAxis.x * axial),
        y: basePoint.y + (config.toolAxis.y * axial),
        z: basePoint.z + (config.toolAxis.z * axial),
    };
}

export function validateMainHoleTemplate(model: SolidModel, steps: number = 360): string | null {
    const resolved = resolveMainHoleConfig(model);
    if ('error' in resolved) {
        return resolved.error;
    }

    for (let index = 0; index <= steps; index += 1) {
        const alpha = (index / steps) * Math.PI * 2;
        if (!evaluateOpeningPoint(resolved, alpha)) {
            return 'Geometry Error: Opening tool does not intersect main pipe.';
        }
    }

    return null;
}

export function evaluateMainHoleUnrolledPoints(
    model: SolidModel,
    padding: number = 0,
    steps: number = 360,
): Point2D[] {
    const resolved = resolveMainHoleConfig(model);
    if ('error' in resolved) {
        return [];
    }

    const points: Point2D[] = [];

    for (let index = 0; index <= steps; index += 1) {
        const alpha = (index / steps) * Math.PI * 2;
        const point = evaluateOpeningPoint(resolved, alpha);
        if (!point) {
            return [];
        }

        const radial = projectToPlane(point, resolved.mainAxis);
        const xRad = dotVec3(radial, resolved.mainRadialX);
        const zRad = dotVec3(radial, resolved.mainNormal);
        const axial = dotVec3(point, resolved.mainAxis);

        let phi = Math.atan2(zRad, xRad);
        if (phi < 0) {
            phi += Math.PI * 2;
        }

        let phiShift = phi - Math.PI;
        if (phiShift < 0) {
            phiShift += Math.PI * 2;
        }

        points.push({
            x: resolved.receiverRadius * phiShift,
            y: axial,
        });
    }

    let minY = Infinity;
    for (const point of points) {
        minY = Math.min(minY, point.y);
    }

    if (!Number.isFinite(minY)) {
        return [];
    }

    return points.map((point) => ({
        x: point.x,
        y: point.y - minY + padding,
    }));
}

export function evaluateMainHoleWidth(model: SolidModel): number | null {
    const resolved = resolveMainHoleConfig(model);
    if ('error' in resolved) {
        return null;
    }

    const axisCosine = clamp(dotVec3(resolved.mainAxis, resolved.toolAxis), -1, 1);
    const sinTheta = Math.sqrt(Math.max(0, 1 - (axisCosine ** 2)));
    if (sinTheta < 1e-9) {
        return null;
    }

    return (2 * resolved.openingTool.radius) / sinTheta;
}
