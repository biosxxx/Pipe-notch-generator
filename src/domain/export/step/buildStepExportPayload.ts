import type { DerivedProject } from '../../model/types';
import type { StepExportRequest } from './types';

function safeNumber(value: number) {
    return Number.isFinite(value) ? value : 0;
}

function formatNumber(value: number) {
    const rounded = Math.round(safeNumber(value) * 1000) / 1000;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(3).replace(/\.?0+$/, '');
}

export function buildStepExportPayload(
    derivedProject: DerivedProject,
    options?: Partial<StepExportRequest['exportOptions']>,
): StepExportRequest {
    const { input } = derivedProject;

    return {
        version: 1,
        project: {
            main: {
                od: safeNumber(input.main.od),
                wall: safeNumber(input.main.wall),
            },
            branch: {
                od: safeNumber(input.branch.od),
                wall: safeNumber(input.branch.wall),
            },
            connection: {
                type: input.connection.type,
                axisAngleDeg: safeNumber(input.connection.axisAngleDeg),
                offset: safeNumber(input.connection.offset),
                weldingGap: safeNumber(input.connection.weldingGap),
                seamAngleDeg: safeNumber(input.connection.seamAngleDeg),
                penetrationMode: input.connection.penetrationMode,
                penetrationDepth: safeNumber(input.connection.penetrationDepth),
                useOuterBranchContour: input.connection.useOuterBranchContour,
            },
        },
        exportOptions: {
            mode: 'assembly',
            units: 'mm',
            includeMain: true,
            includeBranch: true,
            includeFusedBody: options?.includeFusedBody ?? false,
        },
    };
}

export function buildStepExportFilename(request: StepExportRequest) {
    const { project } = request;
    return [
        'pipe_notch',
        project.connection.type,
        `${formatNumber(project.branch.od)}x${formatNumber(project.branch.wall)}`,
        'on',
        `${formatNumber(project.main.od)}x${formatNumber(project.main.wall)}`,
        `${formatNumber(project.connection.axisAngleDeg)}deg`,
        request.exportOptions.mode,
    ].join('_') + '.step';
}
