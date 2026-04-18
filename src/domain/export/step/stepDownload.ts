import type { StepExportErrorPayload, StepExportResponse, StepMimeType } from './types';

function extractFilenameFromDisposition(disposition: string | null) {
    if (!disposition) {
        return null;
    }

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        return decodeURIComponent(utf8Match[1]);
    }

    const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
    return plainMatch?.[1] ?? null;
}

function base64ToBlob(base64: string, mimeType: StepMimeType) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mimeType });
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

export async function readStructuredStepError(response: Response) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        const payload = await response.json() as Partial<StepExportErrorPayload>;
        if (payload.error?.message) {
            return payload.error.message;
        }
    }

    const fallback = await response.text();
    return fallback || `STEP export failed with status ${response.status}.`;
}

export async function downloadStepResponse(response: Response, fallbackFilename: string) {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
        const payload = await response.json() as StepExportResponse | StepExportErrorPayload;
        if ('error' in payload) {
            throw new Error(payload.error.message);
        }

        if (payload.downloadUrl) {
            const remoteResponse = await fetch(payload.downloadUrl);
            if (!remoteResponse.ok) {
                throw new Error(`STEP export download failed with status ${remoteResponse.status}.`);
            }

            const remoteBlob = await remoteResponse.blob();
            triggerBrowserDownload(remoteBlob, payload.filename || fallbackFilename);
            return payload;
        }

        if (!payload.fileBytesBase64) {
            throw new Error('STEP export response did not include file data.');
        }

        const blob = base64ToBlob(payload.fileBytesBase64, payload.mimeType);
        triggerBrowserDownload(blob, payload.filename || fallbackFilename);
        return payload;
    }

    const blob = await response.blob();
    const filename = extractFilenameFromDisposition(response.headers.get('content-disposition')) ?? fallbackFilename;
    triggerBrowserDownload(blob, filename);

    return null;
}
