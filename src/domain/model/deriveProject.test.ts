import { describe, expect, it } from 'vitest';
import { DEFAULT_PROJECT } from './defaults';
import { deriveProject } from './deriveProject';

describe('deriveProject', () => {
    it('derives inner diameters and default set_in penetration', () => {
        const derived = deriveProject({
            ...DEFAULT_PROJECT,
            connection: {
                ...DEFAULT_PROJECT.connection,
                type: 'set_in',
                penetrationMode: 'by_rule',
            },
        });

        expect(derived.main.id).toBe(94);
        expect(derived.branch.id).toBe(46);
        expect(derived.connection.resolvedPenetrationDepth).toBe(3);
        expect(derived.limits.maxOffset).toBe(22);
    });

    it('flags invalid wall thickness combinations', () => {
        const derived = deriveProject({
            ...DEFAULT_PROJECT,
            main: {
                od: 100,
                wall: 60,
            },
        });

        expect(derived.validation.isValid).toBe(false);
        expect(derived.validation.errors.some((message) => message.code === 'main-id')).toBe(true);
    });
});
