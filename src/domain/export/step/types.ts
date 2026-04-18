export type StepPartName = 'MainPipe' | 'BranchPipe' | 'FusedBody';
export type StepMimeType = 'model/step' | 'application/step' | 'application/octet-stream';

export interface StepExportRequest {
    version: 1;
    project: {
        main: {
            od: number;
            wall: number;
        };
        branch: {
            od: number;
            wall: number;
        };
        connection: {
            type: 'set_on' | 'set_in';
            axisAngleDeg: number;
            offset: number;
            weldingGap: number;
            seamAngleDeg: number;
            penetrationMode: 'by_rule' | 'by_value';
            penetrationDepth: number;
            useOuterBranchContour: boolean;
        };
    };
    exportOptions: {
        mode: 'assembly';
        units: 'mm';
        includeMain: true;
        includeBranch: true;
        includeFusedBody?: boolean;
    };
}

export interface StepExportResponse {
    filename: string;
    mimeType: StepMimeType;
    fileBytesBase64?: string;
    downloadUrl?: string;
    meta: {
        units: 'mm';
        parts: StepPartName[];
        warnings: string[];
    };
}

export interface StepExportErrorPayload {
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}

export interface StepCapability {
    enabled: boolean;
    localEnabled?: boolean;
    endpoint: string | null;
    timeoutMs: number;
    reason?: string;
}

export interface LocalStepExportResult {
    blob: Blob;
    filename: string;
    warnings: string[];
}

export interface LocalStepWorkerRequest {
    type: 'export-step';
    payload: StepExportRequest;
}

export interface LocalStepWorkerSuccess {
    type: 'success';
    filename: string;
    warnings: string[];
    mimeType: StepMimeType;
    buffer: ArrayBuffer;
}

export interface LocalStepWorkerError {
    type: 'error';
    error: string;
}

export type LocalStepWorkerResponse = LocalStepWorkerSuccess | LocalStepWorkerError;
