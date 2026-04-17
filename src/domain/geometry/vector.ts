export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export function vec3(x: number, y: number, z: number): Vec3 {
    return { x, y, z };
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
    return vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
    return vec3(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function scaleVec3(v: Vec3, factor: number): Vec3 {
    return vec3(v.x * factor, v.y * factor, v.z * factor);
}

export function dotVec3(a: Vec3, b: Vec3): number {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

export function crossVec3(a: Vec3, b: Vec3): Vec3 {
    return vec3(
        (a.y * b.z) - (a.z * b.y),
        (a.z * b.x) - (a.x * b.z),
        (a.x * b.y) - (a.y * b.x),
    );
}

export function lengthVec3(v: Vec3): number {
    return Math.sqrt(dotVec3(v, v));
}

export function normalizeVec3(v: Vec3, fallback: Vec3 = vec3(0, 1, 0)): Vec3 {
    const len = lengthVec3(v);
    if (len < 1e-9) {
        return fallback;
    }

    return scaleVec3(v, 1 / len);
}
