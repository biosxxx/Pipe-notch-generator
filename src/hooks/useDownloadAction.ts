import { useCallback } from 'react';
import { calculateUnrolledPoints } from '../core/geometry-engine';
import { createDxfString, DxfWriter } from '../core/dxf-writer';
import { generatePdf } from '../core/pdf-generator';
import { useDerivedProject } from './useDerivedProject';

export function useDownloadAction() {
    const derivedProject = useDerivedProject();
    const params = derivedProject.geometry;

    const download = useCallback((type: 'pipe' | 'hole', format: 'dxf' | 'pdf' = 'dxf') => {
        if (!derivedProject.validation.isValid) {
            alert(derivedProject.validation.errors[0]?.message || 'Project parameters are invalid.');
            return;
        }

        if (format === 'pdf') {
            generatePdf(params, type);
            return;
        }

        const points = calculateUnrolledPoints(params, type);

        if (points.length === 0) {
            alert("Could not generate valid geometry for export.");
            return;
        }

        // 2. Normalize / Frame Logic
        const closed = true;
        let finalPoints = points;

        if (type === 'pipe') {
            const maxX = points[points.length - 1].x;
            finalPoints = [
                { x: 0, y: 0 },
                ...points,
                { x: maxX, y: 0 },
                { x: 0, y: 0 }
            ];
        }

        // 3. Serialize
        let dxfString = "";

        if (type === 'hole') {
            // Calculate bounds for center lines
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            finalPoints.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            const writer = new DxfWriter();

            // Draw the contour (White/Default)
            writer.addPolyline(finalPoints, closed);

            // Draw Center Lines (Red = 1)
            // Vertical: (CenterX, MinY) -> (CenterX, MaxY)
            writer.addLine({ x: centerX, y: minY }, { x: centerX, y: maxY }, 1);

            // Horizontal: (MinX, CenterY) -> (MaxX, CenterY)
            writer.addLine({ x: minX, y: centerY }, { x: maxX, y: centerY }, 1);

            dxfString = writer.createString();

        } else {
            dxfString = createDxfString(finalPoints, closed);
        }

        // 4. Download
        const blob = new Blob([dxfString], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        const normalizedFilename = `notch_${derivedProject.connection.type}_${params.d2}x${params.thickness}_on_${params.d1}x${params.mainThickness}_${params.angle}deg_${type}.dxf`;

        a.href = url;
        a.download = normalizedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    }, [derivedProject, params]);

    return download;
}
