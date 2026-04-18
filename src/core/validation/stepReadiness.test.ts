import { describe, expect, it } from 'vitest';
import { DEFAULT_PROJECT } from '../../domain/model/defaults';
import { deriveProject } from '../../domain/model/deriveProject';
import { evaluateStepReadiness } from './stepReadiness';

describe('evaluateStepReadiness', () => {
    it('marks the default project as ready for STEP export', () => {
        const derived = deriveProject(DEFAULT_PROJECT);
        const readiness = evaluateStepReadiness(derived);

        expect(readiness.isReady).toBe(true);
        expect(readiness.errors).toEqual([]);
    });

    it('surfaces invalid geometry as readiness errors', () => {
        const derived = deriveProject({
            ...DEFAULT_PROJECT,
            main: {
                od: 100,
                wall: 60,
            },
        });
        const readiness = evaluateStepReadiness(derived);

        expect(readiness.isReady).toBe(false);
        expect(readiness.errors).toContain('Main pipe inner diameter must stay above 0.');
    });

    it('preserves export warnings from the derived project', () => {
        const derived = deriveProject({
            ...DEFAULT_PROJECT,
            connection: {
                ...DEFAULT_PROJECT.connection,
                weldingGap: 0.25,
            },
        });
        const readiness = evaluateStepReadiness(derived);

        expect(readiness.warnings).toContain('Welding gap is small; fit-up may be tight.');
    });
});
