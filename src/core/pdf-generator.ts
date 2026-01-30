import { jsPDF } from 'jspdf';
import type { PipeParameters, Point2D } from '../types';
import { calculateUnrolledPoints } from './geometry-engine';

/**
 * Generates a 1:1 scale PDF for pipe fabrication.
 * Layout:
 * - Page is High enough to fit Template Height + Margins + Headers.
 * - Y=0 (Model) corresponds to the Bottom Cuttable Edge (physical bottom of sheet).
 * - Y increases Upwards.
 * - PDF Y increases Downwards.
 */
export function generatePdf(params: PipeParameters, type: 'pipe' | 'hole'): void {
    // 1. Calculate Points
    // Note: calculateUnrolledPoints now returns points normalized so that MinY = Padding.
    const points = calculateUnrolledPoints(params, type);

    if (!points || points.length === 0) {
        alert("No geometry to export.");
        return;
    }

    // 2. Analyze Geometry
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    // We know from engine that minY is Padding (>=0). But let's check max and min explicitly for completeness.
    points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });

    // Content Dimensions (Model)
    // Width is straight forward.
    const contentWidth = maxX - minX;

    // Height:
    // Model Y goes from 0 (Bottom Edge) to maxY.
    // The geometry points sit between [Padding, maxY].
    // Solid sheet area is [0, Padding].
    // Full Template Height = maxY.
    const contentHeight = maxY;

    // 3. Page Setup
    const marginLeft = 12;
    const marginRight = 12;
    const marginTop = 8;
    const marginBottom = 12;

    const pageW = contentWidth + marginLeft + marginRight;
    const pageH = contentHeight + marginTop + marginBottom;

    const orientation = pageW > pageH ? 'l' : 'p';

    const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [pageW, pageH]
    });

    // 4. Coordinate Mapping
    // originX: Start drawing from marginLeft.
    // originY: Start drawing from Bottom (pageH - marginBottom).
    // Model Y is positive Up. PDF Y is positive Down.
    // ScreenY = OriginY - ModelY.

    const originX = marginLeft - minX; // usually minX is 0, so just marginLeft
    const originY = pageH - marginBottom;

    const toPage = (x: number, y: number) => ({
        x: originX + x,
        y: originY - y
    });

    // 5. Compact Metadata (Inside Template)
    const fmt = (value: number, digits = 1) => {
        if (!Number.isFinite(value)) return '0';
        const fixed = value.toFixed(digits);
        return fixed.replace(/\.0+$/, '');
    };

    const padding = type === 'pipe' ? (params.paddingD2 || 0) : (params.paddingD1 || 0);
    const dateStamp = new Date().toLocaleDateString();

    const infoLines = [
        `${type === 'pipe' ? 'Branch' : 'Hole'} D${type === 'pipe' ? fmt(params.d2) : fmt(params.d1)}`,
        `D1 ${fmt(params.d1)}  D2 ${fmt(params.d2)}  A ${fmt(params.angle)}°  Off ${fmt(params.offset)}`,
        `T ${fmt(params.thickness)}  Gap ${fmt(params.weldingGap)}  Seam ${fmt(params.startAngle)}°  Pad ${fmt(padding)}`,
        `W ${fmt(contentWidth)}  H ${fmt(contentHeight)}  1:1  ${dateStamp}`,
    ];

    let infoFontSize = 6;
    let lineH = 3;
    pdf.setFontSize(infoFontSize);
    pdf.setTextColor(0, 0, 0);

    if (type === 'pipe') {
        const rulerH = 5;
        const anchorX = minX + contentWidth * 0.06;
        let curveY = minY;
        let bestDist = Infinity;
        for (const p of points) {
            const dist = Math.abs(p.x - anchorX);
            if (dist < bestDist) {
                bestDist = dist;
                curveY = p.y;
            }
        }

        const infoBlockH = infoLines.length * lineH;
        const maxStartY = Math.max(1, curveY - 1);
        const availableH = Math.max(0, maxStartY - (rulerH + 1));

        if (availableH > 0 && availableH < infoBlockH) {
            const scale = availableH / infoBlockH;
            infoFontSize = Math.max(4, infoFontSize * scale);
            lineH = Math.max(2, lineH * scale);
            pdf.setFontSize(infoFontSize);
        }

        const minStartY = rulerH + 1 + (infoLines.length - 1) * lineH;
        let startY = Math.min(maxStartY, padding > 0 ? padding - 1 : maxStartY);
        if (startY < minStartY) {
            startY = maxStartY;
        }

        const infoX = anchorX;
        infoLines.forEach((line, idx) => {
            const y = startY - idx * lineH;
            const p = toPage(infoX, y);
            pdf.text(line, p.x, p.y);
        });
    } else {
        // Hole template: place a compact block near the centroid
        let cx = 0;
        let cy = 0;
        for (const p of points) {
            cx += p.x;
            cy += p.y;
        }
        cx /= points.length;
        cy /= points.length;

        const lineH = 3;
        const centerLines = [
            `${type === 'pipe' ? 'Branch' : 'Hole'} D${type === 'pipe' ? fmt(params.d2) : fmt(params.d1)}`,
            `D1 ${fmt(params.d1)}  D2 ${fmt(params.d2)}  A ${fmt(params.angle)}°  Off ${fmt(params.offset)}`,
            `T ${fmt(params.thickness)}  Gap ${fmt(params.weldingGap)}  W ${fmt(contentWidth)}  H ${fmt(contentHeight)}`,
            `Pad ${fmt(padding)}  1:1  ${dateStamp}`,
        ];

        centerLines.forEach((line, idx) => {
            const y = cy + (centerLines.length - 1 - idx) * lineH;
            const p = toPage(cx, y);
            pdf.text(line, p.x, p.y, { align: 'center' });
        });
    }

    // 6. Draw Contour
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(0, 0, 0); // Black

    // Draw the curve
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = toPage(points[i].x, points[i].y);
        const p2 = toPage(points[i + 1].x, points[i + 1].y);
        pdf.line(p1.x, p1.y, p2.x, p2.y);
    }

    // If D2 Pipe, draw the sheet box bounds?
    // Bottom line (y=0), Left side, Right side.
    if (type === 'pipe') {
        const bl = toPage(minX, 0);
        const br = toPage(maxX, 0);
        const tl = toPage(minX, points[0].y); // Start of curve
        const tr = toPage(maxX, points[points.length - 1].y); // End of curve

        // Bottom Edge
        pdf.line(bl.x, bl.y, br.x, br.y);
        // Left Edge
        pdf.line(bl.x, bl.y, tl.x, tl.y);
        // Right Edge
        pdf.line(br.x, br.y, tr.x, tr.y);
    }
    else if (type === 'hole') {
        // Close the loop for hole
        const pFirst = toPage(points[0].x, points[0].y);
        const pLast = toPage(points[points.length - 1].x, points[points.length - 1].y);
        pdf.line(pLast.x, pLast.y, pFirst.x, pFirst.y);
    }

    // 7. Center Line (Hole) - Red Crosshair
    if (type === 'hole') {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        pdf.setDrawColor(255, 0, 0); // Red
        pdf.setLineWidth(0.3);
        // pdf.setLineDashPattern([5, 2, 1, 2], 0); // Solid lines requested for Crosshair? Prompt says "Red Lines crossing". Usually solid. 
        // Note: Prompt didn't explicitly forbid dash, but usually crosshairs are solid or long dash.
        // Let's use solid for clarity as per "Red Cross" description.

        // Vertical Line: Bottom of hole to Top of hole
        // "spanning the height and width of the opening"

        const vBot = toPage(centerX, minY);
        const vTop = toPage(centerX, maxY);
        pdf.line(vBot.x, vBot.y, vTop.x, vTop.y);

        // Horizontal Line: Left of hole to Right of hole
        const hLeft = toPage(minX, centerY);
        const hRight = toPage(maxX, centerY);
        pdf.line(hLeft.x, hLeft.y, hRight.x, hRight.y);

        pdf.setDrawColor(0, 0, 0); // Reset
    }

    // 9. Ruler (The Grid) - For D2
    // Along y=0 to y=5
    // Ensure paddingD2 is large enough? The prompt says "Ruler must be drawn inside this padding area".
    // If padding is 0, it overlaps geometry?
    // We'll draw it regardless.
    if (type === 'pipe') {
        const rulerH = 5; // mm
        // Base line is y=0 (already drawn by bound box? Redraw to be safe)
        pdf.setDrawColor(0, 0, 0);
        pdf.setTextColor(0, 0, 0);

        const rStart = minX;
        const rEnd = maxX; // circumference
        const rWidth = maxX - minX;

        // Ticks
        for (let deg = 0; deg <= 360; deg += 1) { // 0.5 might be too dense for PDF, stick to 1 for Medium? Prompt asked for 0.5.
            // Optimize: drawing 720 lines in jsPDF is fast.
            const x = rStart + (deg / 360) * rWidth;
            const pBase = toPage(x, 0);

            let tickH = 1;
            if (deg % 10 === 0) tickH = 4;
            else if (deg % 5 === 0) tickH = 2.5;
            else if (deg % 1 === 0) tickH = 1.5;
            else checkHalfDegree(); // Not looping 0.5 here.

            const pTop = toPage(x, tickH);
            pdf.line(pBase.x, pBase.y, pTop.x, pTop.y);

            if (deg % 10 === 0) {
                pdf.setFontSize(6);
                // Label above tick
                const pText = toPage(x - 1, tickH + 2);
                pdf.text(deg.toString(), pText.x, pText.y);
            }
        }

        // 0.5 ticks
        // Only if scale permits? 360 segments is fine.
        // Doing a separate loop or interleaved logic.
        // Let's verify requirement: "Minor ticks: Every 0.5° (Short line)".
        // I'll skip 0.5 loop to save file size unless strictly required. 1mm is usually fine.
        // User asked for "0.5 increments". Okay.
        for (let deg = 0.5; deg < 360; deg += 1) {
            const x = rStart + (deg / 360) * rWidth;
            const pBase = toPage(x, 0);
            const pTop = toPage(x, 1);
            pdf.line(pBase.x, pBase.y, pTop.x, pTop.y);
        }
    }

    // 10. Save
    const filename = `notch_D${params.d1}_D${params.d2}_${type}.pdf`;
    pdf.save(filename);

    function checkHalfDegree() { }
}
