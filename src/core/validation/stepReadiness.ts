import type { DerivedProject } from '../../domain/model/types';

export interface StepReadinessResult {
    isReady: boolean;
    errors: string[];
    warnings: string[];
}

function uniqueMessages(messages: string[]) {
    return Array.from(new Set(messages));
}

export function evaluateStepReadiness(derivedProject: DerivedProject): StepReadinessResult {
    const errors = [...derivedProject.validation.errors.map((message) => message.message)];
    const warnings = [...derivedProject.validation.warnings.map((message) => message.message)];

    if (!(derivedProject.main.od > 0)) {
        errors.push('Main pipe outer diameter must be greater than 0.');
    }
    if (!(derivedProject.branch.od > 0)) {
        errors.push('Branch pipe outer diameter must be greater than 0.');
    }
    if (!(derivedProject.main.wall > 0)) {
        errors.push('Main pipe wall thickness must be greater than 0.');
    }
    if (!(derivedProject.branch.wall > 0)) {
        errors.push('Branch pipe wall thickness must be greater than 0.');
    }
    if (!(derivedProject.main.id > 0)) {
        errors.push('Main pipe inner diameter must stay above 0.');
    }
    if (!(derivedProject.branch.id > 0)) {
        errors.push('Branch pipe inner diameter must stay above 0.');
    }
    if (derivedProject.connection.axisAngleDeg < 1 || derivedProject.connection.axisAngleDeg > 90) {
        errors.push('Axis angle must stay between 1 and 90 degrees.');
    }
    if (Math.abs(derivedProject.connection.offset) > derivedProject.limits.maxOffset + 1e-6) {
        errors.push(`Center offset exceeds the valid range of +/- ${derivedProject.limits.maxOffset.toFixed(2)} mm.`);
    }
    if (
        derivedProject.connection.type === 'set_in'
        && derivedProject.connection.penetrationMode === 'by_value'
        && derivedProject.connection.penetrationDepth < 0
    ) {
        errors.push('Manual penetration depth cannot be negative.');
    }

    return {
        isReady: errors.length === 0,
        errors: uniqueMessages(errors),
        warnings: uniqueMessages(warnings),
    };
}
