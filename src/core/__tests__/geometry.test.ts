import { describe, it, expect } from 'vitest';
import { calculateNotchGeometry } from '../geometry-engine';
import { generateDXF } from '../dxf-service';
import type { PipeParameters } from '../../types';

describe('Geometry Engine', () => {
    const baseParams: PipeParameters = {
        d1: 100,
        d2: 50,
        thickness: 5,
        angle: 90,
        offset: 0,
        weldingGap: 0,
        startAngle: 0,
        paddingD1: 20,
        paddingD2: 20,
        calcByID: true
    };

    it('should calculate intersection for standard 90 degree T-joint', () => {
        const result = calculateNotchGeometry(baseParams);
        expect(result.isValid).toBe(true);
        expect(result.vertices.length).toBeGreaterThan(0);
        // At 90 degrees with 0 offset and gap, y=0 (cut end) 
        // Peak depth should be roughly related to R1 calculation.
        // We just ensure it runs and yields numbers.
        expect(result.vertices[0].x).toBeDefined();
    });

    it('should handle edge case angles (1 degree)', () => {
        const params = { ...baseParams, angle: 1 };
        const result = calculateNotchGeometry(params);
        expect(result.isValid).toBe(true);
    });

    it('should fail when pipes do not intersect (offset too large)', () => {
        const params = { ...baseParams, offset: 60 }; // R1=50, Offset=60. Misses.
        const result = calculateNotchGeometry(params);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("do not intersect");
    });

    it('should generate valid DXF string', () => {
        const dxf = generateDXF('pipe', baseParams);
        expect(dxf).toContain('SECTION');
        expect(dxf).toContain('POLYLINE');
        expect(dxf).toContain('VERTEX');
        expect(dxf).toContain('SEQEND');
        expect(dxf).toContain('EOF');
    });

    it('should generate hole template DXF', () => {
        const dxf = generateDXF('hole', baseParams);
        expect(dxf).toContain('POLYLINE');
        // Hole template has a frame/box added
        expect(dxf).toContain('VERTEX');
    });
});
