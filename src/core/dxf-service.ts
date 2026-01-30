import type { Point2D, PipeParameters } from '../types';
import { calculateNotchGeometry } from './geometry-engine';
import { degToRad, safeSmall } from './math-utils';

/**
 * Generates a valid DXF string for the pipe template or the hole template.
 */
export function generateDXF(type: 'pipe' | 'hole', params: PipeParameters): string {
    const { startAngle, d1, d2, thickness, angle, offset, weldingGap, paddingD1, paddingD2 } = params;
    const pad = (type === 'pipe' ? paddingD2 : paddingD1) || 0;

    // We basically need to re-calculate points for 'hole' since it wasn't valid in calculateNotchGeometry (which does pipe)
    // Or we extend calculateNotchGeometry.
    // For 'pipe', we can reuse calculateNotchGeometry logic but specifically need the 2D contour.

    let points: Point2D[] = [];

    if (type === 'pipe') {
        const result = calculateNotchGeometry(params, 360, params.thickness > 0); // High res for DXF
        if (!result.isValid || !result.contour2D) return "";

        // We need to apply startAngle rotation to the x-axis (unrolled)
        // x in contour2D is just 0..circumference. 
        // We simulate "rotation" by shifting x.
        const circumference = Math.PI * d2; // Standard D2
        const shiftX = (startAngle / 360) * circumference;

        points = result.contour2D.map(p => ({
            x: (p.x + shiftX) % circumference,
            y: p.y
        }));

        // Handle wrap-around split? For simplicity, we might just letting it flow or sort. 
        // Actually, simple shift might break continuity if not careful.
        // Better: recalculate with startAngle inside the loop like the legacy code did.

        // Let's reimplement the specific 2D loop from legacy for maximum fidelity & simplicity for DXF
        points = calculatePipe2D(params);

    } else {
        points = calculateHole2D(params);
    }

    if (points.length === 0) return "";

    // Normalize Coordinates for Plotting
    // Pipe: Invert Y (legacy logic: maxY - y + pad)
    // Hole: Shift Y (y - minY + pad)
    let shiftedPoints: Point2D[];

    if (type === 'pipe') {
        const maxY = Math.max(...points.map(p => p.y));
        shiftedPoints = points.map(p => ({
            x: p.x,
            y: maxY - p.y + pad
        }));
    } else {
        const minY = Math.min(...points.map(p => p.y));
        shiftedPoints = points.map(p => ({
            x: p.x,
            y: p.y - minY + pad
        }));
    }

    // --- DXF Assembly ---
    const getHeader = () => `0\nSECTION\n2\nENTITIES\n`;
    const getFooter = () => `0\nENDSEC\n0\nEOF\n`;
    const getPolyline = (closed: boolean) =>
        `0\nPOLYLINE\n8\n0\n66\n1\n70\n${closed ? 1 : 0}\n`;
    const getVertex = (x: number, y: number) =>
        `0\nVERTEX\n8\n0\n10\n${x.toFixed(4)}\n20\n${y.toFixed(4)}\n30\n0.0\n`;
    const getSeqEnd = () => `0\nSEQEND\n`;

    let dxf = getHeader();

    // Main Contour
    dxf += getPolyline(type === 'hole'); // Pipe template might be open/wrap, Hole is closed loop usually?
    // Legacy: Pipe 70=1 (Closed), Hole 70=1 (Closed)
    // But for pipe template, we explicitly draw the rectangle bounds in legacy? 
    // Legacy Pipe: Loop points, then add bottom-right and bottom-left to close the sheet.

    shiftedPoints.forEach(p => {
        dxf += getVertex(p.x, p.y);
    });

    if (type === 'pipe') {
        // Close the template rectangle manually like legacy
        const lastX = shiftedPoints[shiftedPoints.length - 1].x;
        dxf += getVertex(lastX, 0.0);
        dxf += getVertex(0.0, 0.0);
    }

    dxf += getSeqEnd();

    // For Hole Template, legacy adds a rectangle frame?
    if (type === 'hole') {
        const maxY = Math.max(...shiftedPoints.map(p => p.y)) + pad;
        const maxX = Math.PI * d1; // Circumference of main pipe

        // Add Outer Frame
        dxf += getPolyline(true);
        dxf += getVertex(0, 0);
        dxf += getVertex(maxX, 0);
        dxf += getVertex(maxX, maxY);
        dxf += getVertex(0, maxY);
        dxf += getSeqEnd();
    }

    dxf += getFooter();
    return dxf;
}

function calculatePipe2D(params: PipeParameters): Point2D[] {
    const { d1, d2, thickness, angle, offset, weldingGap, startAngle } = params;
    // Legacy mapping: calcByID used 'checked' default.
    // If we want "Deep Cut", we use calcByID=true logic => R2_outer.
    // But legacy text says "Deep Cut ... using OD logic".

    // NOTE: In legacy code `calculatePoints`:
    // R2_calc = calcByID ? R2_outer : R2_inner;
    // We assume default is Deep Cut.

    const R1 = d1 / 2;
    const R2_outer = d2 / 2;
    const R2_inner = R2_outer - thickness;
    // Assume we want the "Deep Cut" (outer) mostly for templates unless specified otherwise
    const R2_calc = R2_outer; // As per legacy 'checked' default

    const R2_draw = R2_outer;
    const angleRad = degToRad(angle);
    const startAngleRad = degToRad(startAngle);

    const sinTheta = Math.sin(angleRad);
    const tanTheta = Math.tan(angleRad);
    const sT = safeSmall(sinTheta);
    const tT = safeSmall(tanTheta);

    const steps = 360;
    const points: Point2D[] = [];
    const circumference = 2 * Math.PI * R2_draw;

    for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const angleLoop = ratio * 2 * Math.PI;
        const effAngle = angleLoop + startAngleRad;

        const x = ratio * circumference;

        let term = Math.pow(R1, 2) - Math.pow(R2_calc * Math.sin(effAngle) + offset, 2);

        if (term < 0) {
            if (term > -0.1) term = 0;
            else continue;
        }

        const lengthToTouch = ((1 / sT) * Math.sqrt(term) + (R2_draw * Math.cos(effAngle) / tT)) - weldingGap;
        points.push({ x, y: lengthToTouch });
    }
    return points;
}

function calculateHole2D(params: PipeParameters): Point2D[] {
    // Ported from legacy 'hole' logic
    const { d1, d2, thickness, angle, offset } = params;
    const R1 = d1 / 2;
    const R2_outer = d2 / 2;
    const R2_inner = R2_outer - thickness;

    const angleRad = degToRad(angle);
    const sinTheta = Math.sin(angleRad);
    const cosTheta = Math.cos(angleRad);
    const sT = safeSmall(sinTheta);

    const steps = 360;
    const points: Point2D[] = [];

    for (let i = 0; i <= steps; i++) {
        const alpha = (i / steps) * 2 * Math.PI;
        const R2 = R2_inner; // Hole usually fits the inner diameter of the branch? Or Outer? Legacy says R2_inner.

        const r2Sin = R2 * Math.sin(alpha);
        const r2Cos = R2 * Math.cos(alpha);

        const C1 = r2Cos * cosTheta;
        const C2 = r2Sin + offset;

        const term = R1 * R1 - C2 * C2;
        if (term < 0) continue;

        const sqrtVal = Math.sqrt(term);
        const t = (sqrtVal + C1) / sT;

        const x3d = t * sinTheta - r2Cos * cosTheta;
        const z3d = r2Sin + offset;
        const y3d = t * cosTheta + r2Cos * sinTheta;

        // Unroll projection
        let phi = Math.atan2(z3d, x3d);
        if (phi < 0) phi += 2 * Math.PI;

        let phiShift = phi - Math.PI;
        if (phiShift < 0) phiShift += 2 * Math.PI;

        const xUnroll = R1 * phiShift;
        points.push({ x: xUnroll, y: y3d });
    }

    return points;
}
