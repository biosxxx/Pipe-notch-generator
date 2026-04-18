import { describe, expect, it } from 'vitest';
import { DEFAULT_PROJECT } from '../../model/defaults';
import { deriveProject } from '../../model/deriveProject';
import { exportStepAssemblyInProcess } from './localStepKernel';

describe('exportStepAssemblyInBrowser', () => {
    it('exports a non-empty STEP assembly blob', async () => {
        const derivedProject = deriveProject(DEFAULT_PROJECT);
        const result = await exportStepAssemblyInProcess(derivedProject);
        const text = await result.blob.text();

        expect(result.filename.endsWith('.step')).toBe(true);
        expect(result.blob.size).toBeGreaterThan(1024);
        expect(text).toContain('ISO-10303-21');
        expect(text).toContain('MainPipe');
        expect(text).toContain('BranchPipe');
    }, 20_000);

    it('changes the exported assembly when welding gap changes', async () => {
        const zeroGapProject = deriveProject(DEFAULT_PROJECT);
        const gappedProject = deriveProject({
            ...DEFAULT_PROJECT,
            connection: {
                ...DEFAULT_PROJECT.connection,
                weldingGap: 2,
            },
        });

        const zeroGapResult = await exportStepAssemblyInProcess(zeroGapProject);
        const gappedResult = await exportStepAssemblyInProcess(gappedProject);
        const zeroGapText = await zeroGapResult.blob.text();
        const gappedText = await gappedResult.blob.text();

        expect(gappedResult.filename).toBe(zeroGapResult.filename);
        expect(gappedText).not.toBe(zeroGapText);
    }, 20_000);
});
