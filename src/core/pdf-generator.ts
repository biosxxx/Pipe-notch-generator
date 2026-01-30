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
    const marginLeft = 20;
    const marginRight = 20;
    const marginTop = 30; // Header
    const marginBottom = 20;

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

    // 5. Draw Metadata (Header)
    pdf.setFontSize(10);
    pdf.text(`File: ${type === 'pipe' ? 'Branch Template (D2)' : 'Hole Template (D1)'}`, marginLeft, 10);
    pdf.setFontSize(8);
    pdf.text(`Params: D1=${params.d1}mm, D2=${params.d2}mm, Angle=${params.angle}°, Offset=${params.offset}mm`, marginLeft, 15);
    pdf.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, marginLeft, 20);
    pdf.text(`SCALE 1:1 (Do not scale when printing)`, marginLeft, 25);
    pdf.text(`Padding: ${params.paddingD2 || 0}mm from bottom`, marginLeft, 30);

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

    // 8. Dimensions
    pdf.setDrawColor(0, 0, 255);
    pdf.setTextColor(0, 0, 255);
    pdf.setFontSize(8);

    // Height Dimension
    // Draw on the right side
    const dimX = maxX + 5;
    const dimLineTop = toPage(dimX, maxY);
    const dimLineBot = toPage(dimX, 0); // From bottom (0) to Top (maxY)

    // Lines
    pdf.line(dimLineBot.x, dimLineBot.y, dimLineTop.x, dimLineTop.y);
    // Ticks
    pdf.line(dimLineBot.x - 1, dimLineBot.y, dimLineBot.x + 1, dimLineBot.y);
    pdf.line(dimLineTop.x - 1, dimLineTop.y, dimLineTop.x + 1, dimLineTop.y);

    const hText = `H = ${contentHeight.toFixed(1)} mm`;
    pdf.text(hText, toPage(dimX + 2, contentHeight / 2).x, toPage(dimX + 2, contentHeight / 2).y);

    // Width Dimension
    // Draw above max Y? 
    const dimY = maxY + 5;
    const dimWStart = toPage(minX, dimY);
    const dimWEnd = toPage(maxX, dimY);

    pdf.line(dimWStart.x, dimWStart.y, dimWEnd.x, dimWEnd.y);
    pdf.line(dimWStart.x, dimWStart.y - 1, dimWStart.x, dimWStart.y + 1);
    pdf.line(dimWEnd.x, dimWEnd.y - 1, dimWEnd.x, dimWEnd.y + 1);

    const wText = `W = ${contentWidth.toFixed(1)} mm`;
    pdf.text(wText, toPage(minX + contentWidth / 2 - 10, dimY + 2).x, toPage(minX + contentWidth / 2 - 10, dimY + 2).y);

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
