import type { PipeParameters, Point3D, Point2D } from '../types';
import { degToRad, safeSmall } from './math-utils';

interface GeometryResult {
    vertices: Point3D[];
    indices: number[];
    uvs: number[];
    isValid: boolean;
    error?: string;
    contour2D?: Point2D[]; // Unrolled template points
}

/**
 * Calculates the 3D geometry and unrolled 2D contour for the notched pipe.
 *
 * @param params Pipe parameters
 * @param segments Number of angular segments for the pipe
 *                 Otherwise use R2_inner (ID).
 */
export function calculateNotchGeometry(
    params: PipeParameters,
    segments: number = 128,
    // calculation mode is now inside params.calcByID, checking usage below
): GeometryResult {
    const { d1, d2, thickness, angle, offset, weldingGap, startAngle, calcByID } = params;

    // Safety Guard: Check for NaN or invalid checks BEFORE processing
    if (!d1 || !d2 || d1 <= 0 || d2 <= 0 || isNaN(d1) || isNaN(d2)) {
        return { vertices: [], indices: [], uvs: [], isValid: false, error: "Invalid Diameters." };
    }

    const R1 = d1 / 2;
    const R2_outer = d2 / 2;
    const R2_inner = R2_outer - thickness;

    // Logic Inversion from original: 
    // Checked (true) = Deep Cut = use R2_outer logic for intersection check.
    // This seems counter-intuitive based on variable naming in original code, but 
    // "calcByID ? R2_outer : R2_inner" was the original logic.
    // We keep the behavior: if calcByID is true, we cut "sharper" (to the OD).
    const R2_calc = calcByID ? R2_outer : R2_inner;
    const R2_mesh = R2_outer; // We always render the OD mesh

    const angleRad = degToRad(angle);
    const startAngleRad = degToRad(startAngle); // NOTE: startAngle only affects 2D template usually, but we might want to rotate mesh texture/seam.

    const sinTheta = Math.sin(angleRad);
    const cosTheta = Math.cos(angleRad);
    const tanTheta = Math.tan(angleRad);

    const sT = safeSmall(sinTheta);
    const tT = safeSmall(tanTheta);

    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const contour2D: Point2D[] = [];

    // To match visual mesh, we usually want some length for the pipe.
    const pipe2Length = d1 * 1.5 + 100; // Arbitrary visualization length

    // We generate a grid. 
    // y=0 is the cut face.
    // y=1 is the far end (flat).
    // x is the angle steps around the pipe.

    // We need to check validity first across all points to ensure no intersection miss
    for (let x = 0; x <= segments; x++) {
        const alpha = (x / segments) * 2 * Math.PI;
        const term = Math.pow(R1, 2) - Math.pow(R2_calc * Math.sin(alpha) + offset, 2);
        if (term < -0.1) {
            // Tolerance of -0.1 for float errors, otherwise fail
            return { vertices: [], indices: [], uvs: [], isValid: false, error: "Geometry Error: Pipes do not intersect." };
        }
    }

    for (let y = 0; y <= 1; y++) {
        for (let x = 0; x <= segments; x++) {
            const alpha = (x / segments) * 2 * Math.PI;
            const sinAlpha = Math.sin(alpha);
            const cosAlpha = Math.cos(alpha);

            // Depth Check
            let term = Math.pow(R1, 2) - Math.pow(R2_calc * sinAlpha + offset, 2);
            if (term < 0) term = 0; // Clamp small negatives check covered above

            let len = 0;
            if (y === 0) {
                // Cut End
                // Formula: z = (1/sin(theta)) * sqrt(R1^2 - (R2*sin(alpha) + off)^2) + (R2*cos(alpha) / tan(theta))
                const part1 = (1 / sT) * Math.sqrt(term);
                const part2 = (R2_mesh * cosAlpha) / tT;
                const cutDepth = part1 + part2 - weldingGap;
                len = cutDepth;

                // Save 2D Unrolled Point
                // Unrolled X is along circumference
                const unrolledX = (x / segments) * (2 * Math.PI * R2_outer);
                contour2D.push({ x: unrolledX, y: cutDepth });

            } else {
                // Flat End
                len = d1 + pipe2Length;
            }

            // 3D Transformation (To align pipe2 with main pipe at angle)
            // Standard cylinder is usually up/down Y.
            // Logic from legacy:
            // wx = sinTheta, wy = cosTheta, wz = 0  <-- Vector along pipe2 axis
            // We are building points such that:
            // P = Center + RadialComponent + AxialComponent

            // Legacy code was a bit obscured manually building rotation matrix columns.
            // Let's replicate exact legacy math to ensure matching visual result.

            const wx = Math.sin(angleRad);
            const wy = Math.cos(angleRad);
            const wz = 0;

            // "up" vector relative to the pipe frame?
            // Legacy used: vx=0, vy=0, vz=1. 
            // This implies Z is the "sideways" perpendicular to the plane of the two axes (if offset=0)

            const vx = 0;
            const vy = 0;
            const vz = 1;

            // Cross products for the third basis vector U
            // U = V x W (if V is Y-like and W is Z-like?? No, W is axis.)
            // Legacy: ux = (vy * wz) - (vz * wy) = 0 - 1*cos = -cosTheta
            //         uy = (vz * wx) - (vx * wz) = 1*sin - 0 = sinTheta
            //         uz = (vx * wy) - (vy * wx) = 0

            const ux = -cosTheta;
            const uy = sinTheta;
            const uz = 0;

            // The point on the circular cross-section (before axis rotation):
            // local_x = R2 * cosAlpha
            // local_y = R2 * sinAlpha + offset  <-- Offset is applied in the "sideways" direction of the cut plane
            // local_z = len                     <-- Distance along axis

            // Re-mapping to world using basis vectors U, V, W
            // P = (local_x * U) + (local_y * V) + (local_z * W)

            // Wait, legacy code:
            // pX = (R2_cos * ux) + ((R2_sin + offset) * vx) + (len * wx);

            const radComp1 = R2_mesh * cosAlpha;
            const radComp2 = R2_mesh * sinAlpha + offset;

            const pX = (radComp1 * ux) + (radComp2 * vx) + (len * wx);
            const pY = (radComp1 * uy) + (radComp2 * vy) + (len * wy);
            const pZ = (radComp1 * uz) + (radComp2 * vz) + (len * wz);

            vertices.push(pX, pY, pZ);
            uvs.push(x / segments, y);
        }
    }

    // Generate Indices (standard grid)
    for (let x = 0; x < segments; x++) {
        const a = x;
        const b = x + 1;
        const c = x + segments + 1;
        const d = x + segments + 2;

        // Counter-clockwise
        indices.push(a, b, d);
        indices.push(a, d, c);
    }

    const structuredVertices: Point3D[] = [];
    for (let i = 0; i < vertices.length; i += 3) {
        structuredVertices.push({ x: vertices[i], y: vertices[i + 1], z: vertices[i + 2] });
    }

    return {
        vertices: structuredVertices,
        indices,
        uvs,
        isValid: true,
        contour2D
    };
}

/**
 * Calculates high-precision unrolled 2D points for export.
 * Valid types: 'pipe' (D2 branch template) or 'hole' (D1 hole template).
 */
export function calculateUnrolledPoints(params: PipeParameters, type: 'pipe' | 'hole'): Point2D[] {
    // Hardcoded high resolution for export
    const steps = 360;

    if (type === 'pipe') {
        return calculatePipe2D(params, steps);
    } else {
        return calculateHole2D(params, steps);
    }
}

function calculatePipe2D(params: PipeParameters, steps: number): Point2D[] {
    const { d1, d2, thickness, angle, offset, weldingGap, startAngle, paddingD2, calcByID } = params;

    const R1 = d1 / 2;
    const R2_outer = d2 / 2;
    const R2_inner = R2_outer - thickness;

    // "Deep Cut" logic: check if user wants to use OD or ID for intersection check
    const R2_calc = calcByID ? R2_outer : R2_inner;
    const R2_draw = R2_outer;

    const angleRad = degToRad(angle);
    const startAngleRad = degToRad(startAngle);

    const sinTheta = Math.sin(angleRad);
    const tanTheta = Math.tan(angleRad);
    const sT = safeSmall(sinTheta);
    const tT = safeSmall(tanTheta);

    const points: Point2D[] = [];
    const circumference = 2 * Math.PI * R2_draw;

    for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const effAngle = (ratio * 2 * Math.PI) + startAngleRad;
        const x = ratio * circumference;

        // Depth Calculation
        let term = Math.pow(R1, 2) - Math.pow(R2_calc * Math.sin(effAngle) + offset, 2);

        // Validation / clamping
        if (term < 0) {
            if (term > -0.1) term = 0;
            else continue; // Invalid geometry at this point
        }

        // Cut Length Formula (Raw depth)
        const lengthToTouch = ((1 / sT) * Math.sqrt(term) + (R2_draw * Math.cos(effAngle) / tT)) - weldingGap;

        // Push raw Y (we will normalize later)
        points.push({ x, y: lengthToTouch });
    }

    // Normalization: Find Min Y and shift so MinY = Padding
    const padding = paddingD2 || 0;
    let minY = Infinity;
    for (const p of points) {
        if (p.y < minY) minY = p.y;
    }

    // Check for empty points (invalid geometry)
    if (minY === Infinity) return [];

    for (const p of points) {
        p.y = p.y - minY + padding;
    }

    return points;
}

function calculateHole2D(params: PipeParameters, steps: number): Point2D[] {
    const { d1, d2, thickness, angle, offset, paddingD1 } = params;

    const R1 = d1 / 2;
    const R2_outer = d2 / 2;
    const R2_inner = R2_outer - thickness;

    // Hole is usually cut to match the ID of the branching pipe to let fluid through?
    // Legacy uses R2_inner for hole calculation.
    const R2_hole = R2_inner;

    const angleRad = degToRad(angle);
    const sinTheta = Math.sin(angleRad);
    const cosTheta = Math.cos(angleRad);
    const sT = safeSmall(sinTheta);

    const points: Point2D[] = [];

    for (let i = 0; i <= steps; i++) {
        const alpha = (i / steps) * 2 * Math.PI;

        const r2Sin = R2_hole * Math.sin(alpha);
        const r2Cos = R2_hole * Math.cos(alpha);

        const C1 = r2Cos * cosTheta;
        const C2 = r2Sin + offset;

        const term = R1 * R1 - C2 * C2;
        if (term < 0) continue;

        const sqrtVal = Math.sqrt(term);
        const t = (sqrtVal + C1) / sT;

        // 3D Intersection Point on Cylinder 1 Surface
        const x3d = t * sinTheta - r2Cos * cosTheta;
        const z3d = r2Sin + offset; // Radial component 1
        const y3d = t * cosTheta + r2Cos * sinTheta; // Axial component along D1

        // Unroll D1
        let phi = Math.atan2(z3d, x3d);
        if (phi < 0) phi += 2 * Math.PI;

        // Shift so seam is centered?
        let phiShift = phi - Math.PI;
        if (phiShift < 0) phiShift += 2 * Math.PI;

        const xUnroll = R1 * phiShift;
        const yUnroll = y3d;

        points.push({ x: xUnroll, y: yUnroll });
    }

    // Normalization logic for hole as well (Shift to positive + padding)
    const padding = paddingD1 || 0;
    let minY = Infinity;
    for (const p of points) {
        if (p.y < minY) minY = p.y;
    }

    if (minY === Infinity) return [];

    for (const p of points) {
        p.y = p.y - minY + padding;
    }

    return points;
}
