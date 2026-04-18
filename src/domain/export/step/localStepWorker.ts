/// <reference lib="webworker" />

import { exportStepAssemblyFromRequest } from './localStepKernel';
import type { LocalStepWorkerError, LocalStepWorkerRequest, LocalStepWorkerSuccess } from './types';

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener('message', async (event: MessageEvent<LocalStepWorkerRequest>) => {
    if (event.data?.type !== 'export-step') {
        return;
    }

    try {
        const result = await exportStepAssemblyFromRequest(event.data.payload);
        const buffer = await result.blob.arrayBuffer();
        const response: LocalStepWorkerSuccess = {
            type: 'success',
            filename: result.filename,
            warnings: result.warnings,
            mimeType: 'application/step',
            buffer,
        };

        self.postMessage(response, [buffer]);
    } catch (error) {
        const response: LocalStepWorkerError = {
            type: 'error',
            error: error instanceof Error ? error.message : 'STEP export worker failed.',
        };

        self.postMessage(response);
    }
});

export {};
