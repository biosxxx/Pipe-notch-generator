/**
 * Converts degrees to radians.
 */
export function degToRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Returns a value with a minimum magnitude, preserving sign, to avoid division by zero.
 */
export function safeSmall(val: number, epsilon = 1e-6): number {
    if (Math.abs(val) < epsilon) {
        return val >= 0 ? epsilon : -epsilon;
    }
    return val;
}

/**
 * Clamps a value to 0 if it is very close to 0 (within epsilon).
 * Useful for filtering out floating point noise around zero.
 */
export function clampToZero(val: number, epsilon = 1e-6): number {
    return Math.abs(val) < epsilon ? 0 : val;
}
