import { describe, expect, it } from 'vitest';
import { DEFAULT_PROJECT } from '../../domain/model/defaults';
import { deriveProject } from '../../domain/model/deriveProject';
import { evaluateMainHoleUnrolledPoints } from '../../domain/geometry/mainHoleTemplate';
import { evaluateReceiverTrimUnrolledPoints } from '../../domain/geometry/receiverTrimPreview';
import { getExportPoints } from '../export-points';
import { calculateUnrolledPoints } from './legacy-geometry-engine';

function maxPointDelta(
    actual: Array<{ x: number; y: number }>,
    expected: Array<{ x: number; y: number }>,
) {
    return actual.reduce((max, point, index) => {
        const other = expected[index];
        if (!other) {
            return Infinity;
        }

        return Math.max(
            max,
            Math.abs(point.x - other.x),
            Math.abs(point.y - other.y),
        );
    }, 0);
}

describe('export points', () => {
    it('uses SolidModel unrolled points for branch export', () => {
        const derived = deriveProject(DEFAULT_PROJECT);
        const viaExportHelper = getExportPoints('pipe', derived.geometry, derived);
        const viaSolidEvaluator = evaluateReceiverTrimUnrolledPoints(
            derived.solids,
            derived.geometry.startAngle,
            derived.geometry.paddingD2,
            360,
        );

        expect(viaExportHelper).toEqual(viaSolidEvaluator);
    });

    it('reconstructs the same branch export points from PipeParameters alone', () => {
        const derived = deriveProject({
            ...DEFAULT_PROJECT,
            connection: {
                ...DEFAULT_PROJECT.connection,
                type: 'set_in',
                useOuterBranchContour: false,
                penetrationMode: 'by_value',
                penetrationDepth: 6,
            },
        });

        const viaDerived = getExportPoints('pipe', derived.geometry, derived);
        const viaParamsOnly = getExportPoints('pipe', derived.geometry);

        expect(viaParamsOnly).toEqual(viaDerived);
    });

    it('uses SolidModel unrolled points for main hole export', () => {
        const derived = deriveProject(DEFAULT_PROJECT);

        expect(getExportPoints('hole', derived.geometry, derived)).toEqual(
            evaluateMainHoleUnrolledPoints(derived.solids, derived.geometry.paddingD1, 360),
        );
    });

    it('matches the legacy hole template for the default zero-gap case', () => {
        const derived = deriveProject(DEFAULT_PROJECT);
        const solidPoints = getExportPoints('hole', derived.geometry, derived);
        const legacyPoints = calculateUnrolledPoints(derived.geometry, 'hole');

        expect(solidPoints).toHaveLength(legacyPoints.length);
        expect(maxPointDelta(solidPoints, legacyPoints)).toBeLessThan(1e-9);
    });

    it('reconstructs the same main hole export points from PipeParameters alone', () => {
        const derived = deriveProject({
            ...DEFAULT_PROJECT,
            connection: {
                ...DEFAULT_PROJECT.connection,
                type: 'set_in',
                penetrationMode: 'by_value',
                penetrationDepth: 6,
            },
        });

        const viaDerived = getExportPoints('hole', derived.geometry, derived);
        const viaParamsOnly = getExportPoints('hole', derived.geometry);

        expect(viaParamsOnly).toEqual(viaDerived);
    });
});
