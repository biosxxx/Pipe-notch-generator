import { addVec3, crossVec3, dotVec3, normalizeVec3, scaleVec3, subVec3, vec3, type Vec3 } from './vector';

export interface Plane3D {
    origin: Vec3;
    normal: Vec3;
}

export interface Frame3D {
    origin: Vec3;
    axis: Vec3;
    normal: Vec3;
    binormal: Vec3;
}

function orthogonalize(reference: Vec3, axis: Vec3): Vec3 {
    return subVec3(reference, scaleVec3(axis, dotVec3(reference, axis)));
}

export function createFrame(origin: Vec3, axis: Vec3, upHint: Vec3 = vec3(0, 0, 1)): Frame3D {
    const safeAxis = normalizeVec3(axis, vec3(0, 1, 0));
    const projectedUp = orthogonalize(upHint, safeAxis);
    const fallbackUp = Math.abs(safeAxis.z) > 0.9 ? vec3(1, 0, 0) : vec3(0, 0, 1);
    const safeUp = normalizeVec3(projectedUp, normalizeVec3(orthogonalize(fallbackUp, safeAxis), vec3(1, 0, 0)));
    const binormal = normalizeVec3(crossVec3(safeAxis, safeUp), vec3(1, 0, 0));
    const normal = normalizeVec3(crossVec3(binormal, safeAxis), safeUp);

    return {
        origin,
        axis: safeAxis,
        normal,
        binormal,
    };
}

export function pointAlongAxis(frame: Frame3D, distance: number): Vec3 {
    return addVec3(frame.origin, scaleVec3(frame.axis, distance));
}

export function planeAtAxisOffset(frame: Frame3D, distance: number, normalSign: 1 | -1 = 1): Plane3D {
    return {
        origin: pointAlongAxis(frame, distance),
        normal: scaleVec3(frame.axis, normalSign),
    };
}
