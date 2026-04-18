import type { PipeParameters } from '../types';
import type { DerivedProject } from '../domain/model/types';
import { DxfWriter } from './dxf-writer';
import { getExportPoints } from './export-points';

/**
 * Generates a DXF string from the normalized pattern points used by the app.
 */
export function generateDXF(type: 'pipe' | 'hole', params: PipeParameters, derivedProject?: DerivedProject): string {
    const points = getExportPoints(type, params, derivedProject);

    if (points.length === 0) {
        return '';
    }

    const writer = new DxfWriter();
    const closed = true;

    if (type === 'pipe') {
        const maxX = points[points.length - 1]?.x ?? 0;
        writer.addPolyline([
            { x: 0, y: 0 },
            ...points,
            { x: maxX, y: 0 },
            { x: 0, y: 0 },
        ], closed);
    } else {
        writer.addPolyline(points, closed);

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

        if (Number.isFinite(minX) && Number.isFinite(maxX) && Number.isFinite(minY) && Number.isFinite(maxY)) {
            writer.addRectangle(minX, minY, maxX, maxY);
        }
    }

    return writer.createString();
}
