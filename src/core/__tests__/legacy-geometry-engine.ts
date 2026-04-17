import type { PipeParameters, Point3D, Point2D } from '../../types';
import { degToRad, safeSmall } from '../math-utils';

interface GeometryResult {
    vertices: Point3D[];
    indices: number[];
    uvs: number[];
    isValid: boolean;
    error?: string;
    contour2D?: Point2D[];
}

function getMainOuterRadius(params: PipeParameters) {
    return params.d1 / 2;
}

function getMainInnerRadius(params: PipeParameters) {
    return params.d1Inner / 2;
}

function getBranchOuterRadius(params: PipeParameters) {
    return params.d2 / 2;
}

function getBranchInnerRadius(params: PipeParameters) {
    return params.d2Inner / 2;
}

function getBranchCalcRadius(params: PipeParameters) {
    return params.calcByID ? getBranchOuterRadius(params) : getBranchInnerRadius(params);
}

function getReceiverContactRadius(params: PipeParameters) {
    return params.connectionType === 'set_in' ? getMainInnerRadius(params) : getMainOuterRadius(params);
}

function getAxialPlacementShift(params: PipeParameters) {
    return params.connectionType === 'set_in' ? params.penetrationDepth : 0;
}

export function calculateNotchGeometry(
    params: PipeParameters,
    segments: number = 128,
): GeometryResult {
    const { d1, d2, angle, offset, weldingGap } = params;

    if (!d1 || !d2 || d1 <= 0 || d2 <= 0 || Number.isNaN(d1) || Number.isNaN(d2)) {
        return { vertices: [], indices: [], uvs: [], isValid: false, error: 'Invalid Diameters.' };
    }

    const receiverRadius = getReceiverContactRadius(params);
    const branchOuterRadius = getBranchOuterRadius(params);
    const branchCalcRadius = getBranchCalcRadius(params);
    const axialShift = getAxialPlacementShift(params);

    const angleRad = degToRad(angle);
    const sinTheta = Math.sin(angleRad);
    const cosTheta = Math.cos(angleRad);
    const tanTheta = Math.tan(angleRad);

    const sT = safeSmall(sinTheta);
    const tT = safeSmall(tanTheta);

    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const contour2D: Point2D[] = [];
    const pipe2Length = d1 * 1.5 + 100;

    for (let x = 0; x <= segments; x += 1) {
        const alpha = (x / segments) * 2 * Math.PI;
        const term = (receiverRadius ** 2) - ((branchCalcRadius * Math.sin(alpha)) + offset) ** 2;
        if (term < -0.1) {
            return { vertices: [], indices: [], uvs: [], isValid: false, error: 'Geometry Error: Pipes do not intersect.' };
        }
    }

    for (let y = 0; y <= 1; y += 1) {
        for (let x = 0; x <= segments; x += 1) {
            const alpha = (x / segments) * 2 * Math.PI;
            const sinAlpha = Math.sin(alpha);
            const cosAlpha = Math.cos(alpha);

            let term = (receiverRadius ** 2) - ((branchCalcRadius * sinAlpha) + offset) ** 2;
            if (term < 0) {
                term = 0;
            }

            let len = 0;
            if (y === 0) {
                const part1 = (1 / sT) * Math.sqrt(term);
                const part2 = (branchOuterRadius * cosAlpha) / tT;
                const cutDepth = part1 + part2 - weldingGap - axialShift;
                len = cutDepth;

                contour2D.push({
                    x: (x / segments) * (2 * Math.PI * branchOuterRadius),
                    y: cutDepth,
                });
            } else {
                len = d1 + pipe2Length - axialShift;
            }

            const wx = Math.sin(angleRad);
            const wy = Math.cos(angleRad);
            const wz = 0;

            const vx = 0;
            const vy = 0;
            const vz = 1;

            const ux = -cosTheta;
            const uy = sinTheta;
            const uz = 0;

            const radialX = branchOuterRadius * cosAlpha;
            const radialY = branchOuterRadius * sinAlpha + offset;

            const pX = (radialX * ux) + (radialY * vx) + (len * wx);
            const pY = (radialX * uy) + (radialY * vy) + (len * wy);
            const pZ = (radialX * uz) + (radialY * vz) + (len * wz);

            vertices.push(pX, pY, pZ);
            uvs.push(x / segments, y);
        }
    }

    for (let x = 0; x < segments; x += 1) {
        const a = x;
        const b = x + 1;
        const c = x + segments + 1;
        const d = x + segments + 2;

        indices.push(a, b, d);
        indices.push(a, d, c);
    }

    const structuredVertices: Point3D[] = [];
    for (let index = 0; index < vertices.length; index += 3) {
        structuredVertices.push({
            x: vertices[index],
            y: vertices[index + 1],
            z: vertices[index + 2],
        });
    }

    return {
        vertices: structuredVertices,
        indices,
        uvs,
        isValid: true,
        contour2D,
    };
}

export function calculateUnrolledPoints(params: PipeParameters, type: 'pipe' | 'hole'): Point2D[] {
    const steps = 360;
    return type === 'pipe'
        ? calculatePipe2D(params, steps)
        : calculateHole2D(params, steps);
}

function calculatePipe2D(params: PipeParameters, steps: number): Point2D[] {
    const { angle, offset, weldingGap, startAngle, paddingD2 } = params;

    const receiverRadius = getReceiverContactRadius(params);
    const branchOuterRadius = getBranchOuterRadius(params);
    const branchCalcRadius = getBranchCalcRadius(params);
    const axialShift = getAxialPlacementShift(params);

    const angleRad = degToRad(angle);
    const startAngleRad = degToRad(startAngle);
    const sinTheta = Math.sin(angleRad);
    const tanTheta = Math.tan(angleRad);
    const sT = safeSmall(sinTheta);
    const tT = safeSmall(tanTheta);

    const points: Point2D[] = [];
    const circumference = 2 * Math.PI * branchOuterRadius;

    for (let index = 0; index <= steps; index += 1) {
        const ratio = index / steps;
        const effectiveAngle = (ratio * 2 * Math.PI) + startAngleRad;
        const x = ratio * circumference;
        let term = (receiverRadius ** 2) - ((branchCalcRadius * Math.sin(effectiveAngle)) + offset) ** 2;

        if (term < 0) {
            if (term > -0.1) {
                term = 0;
            } else {
                continue;
            }
        }

        const lengthToTouch = ((1 / sT) * Math.sqrt(term) + (branchOuterRadius * Math.cos(effectiveAngle) / tT))
            - weldingGap
            - axialShift;

        points.push({ x, y: lengthToTouch });
    }

    const padding = paddingD2 || 0;
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

function calculateHole2D(params: PipeParameters, steps: number): Point2D[] {
    const { angle, offset, paddingD1 } = params;

    const mainOuterRadius = getMainOuterRadius(params);
    const branchHoleRadius = getBranchCalcRadius(params);
    const axialShift = getAxialPlacementShift(params);

    const angleRad = degToRad(angle);
    const sinTheta = Math.sin(angleRad);
    const cosTheta = Math.cos(angleRad);
    const sT = safeSmall(sinTheta);

    const points: Point2D[] = [];

    for (let index = 0; index <= steps; index += 1) {
        const alpha = (index / steps) * 2 * Math.PI;
        const radialSin = branchHoleRadius * Math.sin(alpha);
        const radialCos = branchHoleRadius * Math.cos(alpha);

        const c1 = radialCos * cosTheta;
        const c2 = radialSin + offset;
        const term = (mainOuterRadius ** 2) - (c2 ** 2);
        if (term < 0) {
            continue;
        }

        const sqrtValue = Math.sqrt(term);
        const t = ((sqrtValue + c1) / sT) - axialShift;

        const x3d = t * sinTheta - radialCos * cosTheta;
        const z3d = radialSin + offset;
        const y3d = t * cosTheta + radialCos * sinTheta;

        let phi = Math.atan2(z3d, x3d);
        if (phi < 0) {
            phi += 2 * Math.PI;
        }

        let phiShift = phi - Math.PI;
        if (phiShift < 0) {
            phiShift += 2 * Math.PI;
        }

        points.push({
            x: mainOuterRadius * phiShift,
            y: y3d,
        });
    }

    const padding = paddingD1 || 0;
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
