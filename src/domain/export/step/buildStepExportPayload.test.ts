import { describe, expect, it } from 'vitest';
import { deriveProject } from '../../model/deriveProject';
import { DEFAULT_PROJECT } from '../../model/defaults';
import { buildStepExportFilename, buildStepExportPayload } from './buildStepExportPayload';

describe('buildStepExportPayload', () => {
    it('builds the assembly payload from the derived project input', () => {
        const derived = deriveProject({
            ...DEFAULT_PROJECT,
            connection: {
                ...DEFAULT_PROJECT.connection,
                type: 'set_in',
                penetrationMode: 'by_value',
                penetrationDepth: 6,
                useOuterBranchContour: false,
            },
        });

        expect(buildStepExportPayload(derived)).toEqual({
            version: 1,
            project: {
                main: {
                    od: 100,
                    wall: 3,
                },
                branch: {
                    od: 50,
                    wall: 2,
                },
                connection: {
                    type: 'set_in',
                    axisAngleDeg: 45,
                    offset: 0,
                    weldingGap: 0,
                    seamAngleDeg: 0,
                    penetrationMode: 'by_value',
                    penetrationDepth: 6,
                    useOuterBranchContour: false,
                },
            },
            exportOptions: {
                mode: 'assembly',
                units: 'mm',
                includeMain: true,
                includeBranch: true,
                includeFusedBody: false,
            },
        });
    });

    it('creates a deterministic assembly filename', () => {
        const derived = deriveProject(DEFAULT_PROJECT);
        const payload = buildStepExportPayload(derived);

        expect(buildStepExportFilename(payload)).toBe(
            'pipe_notch_set_on_50x2_on_100x3_45deg_assembly.step',
        );
    });
});
