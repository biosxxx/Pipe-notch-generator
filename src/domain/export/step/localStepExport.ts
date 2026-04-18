import type { DerivedProject } from '../../model/types';
import { buildStepExportPayload } from './buildStepExportPayload';
import type {
    LocalStepExportResult,
    LocalStepWorkerError,
    LocalStepWorkerRequest,
    LocalStepWorkerResponse,
    LocalStepWorkerSuccess,
} from './types';

function createStepWorker() {
    return new Worker(new URL('./localStepWorker.ts', import.meta.url), {
        type: 'module',
        name: 'step-export-worker',
    });
}

function toBrowserBlob(message: LocalStepWorkerSuccess): LocalStepExportResult {
    return {
        blob: new Blob([message.buffer], { type: message.mimeType }),
        filename: message.filename,
        warnings: message.warnings,
    };
}

function workerErrorMessage(message: LocalStepWorkerError) {
    return message.error || 'STEP export worker failed.';
}

async function exportStepAssemblyWithWorker(payload: LocalStepWorkerRequest['payload']) {
    return new Promise<LocalStepExportResult>((resolve, reject) => {
        const worker = createStepWorker();

        const cleanup = () => {
            worker.onmessage = null;
            worker.onerror = null;
            worker.onmessageerror = null;
            worker.terminate();
        };

        worker.onmessage = (event: MessageEvent<LocalStepWorkerResponse>) => {
            cleanup();

            if (event.data?.type === 'success') {
                resolve(toBrowserBlob(event.data));
                return;
            }

            reject(new Error(workerErrorMessage(event.data)));
        };

        worker.onerror = (event) => {
            cleanup();
            reject(event.error instanceof Error ? event.error : new Error(event.message || 'STEP export worker failed.'));
        };

        worker.onmessageerror = () => {
            cleanup();
            reject(new Error('STEP export worker returned an unreadable message.'));
        };

        const message: LocalStepWorkerRequest = {
            type: 'export-step',
            payload,
        };

        worker.postMessage(message);
    });
}

export async function exportStepAssemblyInBrowser(
    derivedProject: DerivedProject,
): Promise<LocalStepExportResult> {
    if (typeof WebAssembly !== 'object') {
        throw new Error('This browser does not support WebAssembly STEP export.');
    }

    const payload = buildStepExportPayload(derivedProject);

    if (typeof Worker !== 'undefined') {
        return exportStepAssemblyWithWorker(payload);
    }

    const { exportStepAssemblyFromRequest } = await import('./localStepKernel');
    return exportStepAssemblyFromRequest(payload);
}
