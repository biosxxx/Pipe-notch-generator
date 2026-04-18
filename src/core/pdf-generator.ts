import { jsPDF } from 'jspdf';
import type { PipeParameters } from '../types';
import type { DerivedProject } from '../domain/model/types';
import { getExportPoints } from './export-points';

function formatValue(value: number, digits = 1) {
    if (!Number.isFinite(value)) return '0';
    const fixed = value.toFixed(digits);
    return fixed.replace(/\.0+$/, '');
}

export function generatePdf(params: PipeParameters, type: 'pipe' | 'hole', derivedProject?: DerivedProject): void {
    const points = getExportPoints(type, params, derivedProject);

    if (points.length === 0) {
        alert('No geometry to export.');
        return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const point of points) {
        if (point.x < minX) minX = point.x;
        if (point.x > maxX) maxX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.y > maxY) maxY = point.y;
    }

    const contentWidth = maxX - minX;
    const contentHeight = maxY;
    const marginLeft = 12;
    const marginRight = 12;
    const marginTop = 8;
    const marginBottom = 12;
    const pageW = contentWidth + marginLeft + marginRight;
    const pageH = contentHeight + marginTop + marginBottom;
    const orientation = pageW > pageH ? 'l' : 'p';
    const padding = type === 'pipe' ? (params.paddingD2 || 0) : (params.paddingD1 || 0);
    const connectionLabel = params.connectionType === 'set_in' ? 'Set In' : 'Set On';
    const penetrationLabel = params.connectionType === 'set_in'
        ? `  Pen ${formatValue(params.penetrationDepth)}`
        : '';
    const dateStamp = new Date().toLocaleDateString();

    const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [pageW, pageH],
    });

    const originX = marginLeft - minX;
    const originY = pageH - marginBottom;
    const toPage = (x: number, y: number) => ({
        x: originX + x,
        y: originY - y,
    });

    const infoLines = [
        `${type === 'pipe' ? 'Branch' : 'Hole'} Template`,
        `Main ${formatValue(params.d1)} / ${formatValue(params.d1Inner)}  Branch ${formatValue(params.d2)} / ${formatValue(params.d2Inner)}`,
        `Conn ${connectionLabel}  A ${formatValue(params.angle)} deg  Off ${formatValue(params.offset)}${penetrationLabel}`,
        `tM ${formatValue(params.mainThickness)}  tB ${formatValue(params.thickness)}  Gap ${formatValue(params.weldingGap)}  Seam ${formatValue(params.startAngle)} deg`,
        `Pad ${formatValue(padding)}  W ${formatValue(contentWidth)}  H ${formatValue(contentHeight)}  1:1  ${dateStamp}`,
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

        for (const point of points) {
            const dist = Math.abs(point.x - anchorX);
            if (dist < bestDist) {
                bestDist = dist;
                curveY = point.y;
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

        for (let idx = 0; idx < infoLines.length; idx += 1) {
            const pagePoint = toPage(anchorX, startY - idx * lineH);
            pdf.text(infoLines[idx], pagePoint.x, pagePoint.y);
        }
    } else {
        let centerX = 0;
        let centerY = 0;

        for (const point of points) {
            centerX += point.x;
            centerY += point.y;
        }

        centerX /= points.length;
        centerY /= points.length;

        for (let idx = 0; idx < infoLines.length; idx += 1) {
            const y = centerY + (infoLines.length - 1 - idx) * lineH;
            const pagePoint = toPage(centerX, y);
            pdf.text(infoLines[idx], pagePoint.x, pagePoint.y, { align: 'center' });
        }
    }

    pdf.setLineWidth(0.3);
    pdf.setDrawColor(0, 0, 0);

    for (let i = 0; i < points.length - 1; i += 1) {
        const p1 = toPage(points[i].x, points[i].y);
        const p2 = toPage(points[i + 1].x, points[i + 1].y);
        pdf.line(p1.x, p1.y, p2.x, p2.y);
    }

    if (type === 'pipe') {
        const bl = toPage(minX, 0);
        const br = toPage(maxX, 0);
        const tl = toPage(minX, points[0].y);
        const tr = toPage(maxX, points[points.length - 1].y);

        pdf.line(bl.x, bl.y, br.x, br.y);
        pdf.line(bl.x, bl.y, tl.x, tl.y);
        pdf.line(br.x, br.y, tr.x, tr.y);
    } else {
        const pFirst = toPage(points[0].x, points[0].y);
        const pLast = toPage(points[points.length - 1].x, points[points.length - 1].y);
        pdf.line(pLast.x, pLast.y, pFirst.x, pFirst.y);
    }

    if (type === 'hole') {
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        pdf.setDrawColor(255, 0, 0);
        pdf.setLineWidth(0.3);

        const vBot = toPage(centerX, minY);
        const vTop = toPage(centerX, maxY);
        const hLeft = toPage(minX, centerY);
        const hRight = toPage(maxX, centerY);

        pdf.line(vBot.x, vBot.y, vTop.x, vTop.y);
        pdf.line(hLeft.x, hLeft.y, hRight.x, hRight.y);
        pdf.setDrawColor(0, 0, 0);
    }

    if (type === 'pipe') {
        pdf.setDrawColor(0, 0, 0);
        pdf.setTextColor(0, 0, 0);

        const rStart = minX;
        const rWidth = maxX - minX;

        for (let deg = 0; deg <= 360; deg += 1) {
            const x = rStart + (deg / 360) * rWidth;
            const pBase = toPage(x, 0);

            let tickH = 1.5;
            if (deg % 10 === 0) tickH = 4;
            else if (deg % 5 === 0) tickH = 2.5;

            const pTop = toPage(x, tickH);
            pdf.line(pBase.x, pBase.y, pTop.x, pTop.y);

            if (deg % 10 === 0) {
                pdf.setFontSize(6);
                const pText = toPage(x - 1, tickH + 2);
                pdf.text(deg.toString(), pText.x, pText.y);
            }
        }

        for (let deg = 0.5; deg < 360; deg += 1) {
            const x = rStart + (deg / 360) * rWidth;
            const pBase = toPage(x, 0);
            const pTop = toPage(x, 1);
            pdf.line(pBase.x, pBase.y, pTop.x, pTop.y);
        }
    }

    const filename = `notch_${params.connectionType}_${params.d2}x${params.thickness}_on_${params.d1}x${params.mainThickness}_${type}.pdf`;
    pdf.save(filename);
}
