import type {
    DerivedConnection,
    DerivedPipeSpec,
    ProjectInput,
    ValidationMessage,
    ValidationSummary,
} from './types';

interface ValidationContext {
    project: ProjectInput;
    main: DerivedPipeSpec;
    branch: DerivedPipeSpec;
    connection: DerivedConnection;
    maxOffset: number;
}

function createMessage(
    severity: ValidationMessage['severity'],
    code: string,
    message: string,
): ValidationMessage {
    return { severity, code, message };
}

export function validateProject(context: ValidationContext): ValidationSummary {
    const { project, main, branch, connection, maxOffset } = context;
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];

    if (project.main.wall <= 0) {
        errors.push(createMessage('error', 'main-wall', 'Main pipe wall thickness must be greater than 0.'));
    }
    if (project.branch.wall <= 0) {
        errors.push(createMessage('error', 'branch-wall', 'Branch pipe wall thickness must be greater than 0.'));
    }
    if (main.id <= 0) {
        errors.push(createMessage('error', 'main-id', 'Main pipe inner diameter must stay above 0.'));
    }
    if (branch.id <= 0) {
        errors.push(createMessage('error', 'branch-id', 'Branch pipe inner diameter must stay above 0.'));
    }
    if (project.main.wall >= project.main.od / 2) {
        errors.push(createMessage('error', 'main-wall-range', 'Main pipe wall thickness must be smaller than half of OD.'));
    }
    if (project.branch.wall >= project.branch.od / 2) {
        errors.push(createMessage('error', 'branch-wall-range', 'Branch pipe wall thickness must be smaller than half of OD.'));
    }
    if (connection.axisAngleDeg < 1 || connection.axisAngleDeg > 90) {
        errors.push(createMessage('error', 'angle-range', 'Axis angle must stay between 1 and 90 degrees.'));
    }
    if (!Number.isFinite(maxOffset) || maxOffset < 0) {
        errors.push(createMessage('error', 'offset-geometry', 'The selected pipe sizes do not create a valid intersection envelope.'));
    }
    if (Math.abs(connection.offset) > maxOffset + 1e-6) {
        errors.push(createMessage('error', 'offset-range', `Center offset exceeds the valid range of +/- ${maxOffset.toFixed(2)} mm.`));
    }
    if (connection.type === 'set_in' && connection.resolvedPenetrationDepth < 0) {
        errors.push(createMessage('error', 'penetration-negative', 'Penetration depth cannot be negative.'));
    }
    if (
        connection.type === 'set_in'
        && connection.penetrationMode === 'by_value'
        && connection.resolvedPenetrationDepth > main.outerRadius
    ) {
        errors.push(createMessage('error', 'penetration-large', 'Penetration depth is too large for the main pipe section.'));
    }
    if (
        connection.type === 'set_in'
        && connection.penetrationMode === 'by_value'
        && connection.resolvedPenetrationDepth > main.wall
        && branch.od > main.id
    ) {
        errors.push(createMessage('error', 'set-in-fit', 'The branch OD is too large to insert deeper than the main wall thickness.'));
    }

    if (project.main.wall < 1) {
        warnings.push(createMessage('warning', 'main-wall-thin', 'Main pipe wall is very thin.'));
    }
    if (project.branch.wall < 1) {
        warnings.push(createMessage('warning', 'branch-wall-thin', 'Branch pipe wall is very thin.'));
    }
    if (connection.weldingGap < 0.5) {
        warnings.push(createMessage('warning', 'gap-small', 'Welding gap is small; fit-up may be tight.'));
    }
    if (
        connection.type === 'set_in'
        && connection.penetrationMode === 'by_value'
        && connection.resolvedPenetrationDepth > main.wall
    ) {
        warnings.push(createMessage('warning', 'set-in-aggressive', 'Manual penetration goes past the inner wall reference.'));
    }
    if (maxOffset - Math.abs(connection.offset) < 2) {
        warnings.push(createMessage('warning', 'offset-limit', 'Offset is close to the geometric limit.'));
    }

    return {
        errors,
        warnings,
        isValid: errors.length === 0,
    };
}
