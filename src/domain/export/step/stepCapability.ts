import type { StepCapability } from './types';

const DEFAULT_TIMEOUT_MS = 60_000;

function parseTimeout(value: string | undefined) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

export function getStepCapability(): StepCapability {
    const endpoint = import.meta.env.VITE_STEP_EXPORT_URL?.trim() ?? '';
    const timeoutMs = parseTimeout(import.meta.env.VITE_STEP_EXPORT_TIMEOUT_MS);
    const localEnabled = typeof window !== 'undefined' && typeof WebAssembly === 'object';

    if (!localEnabled && !endpoint) {
        return {
            enabled: false,
            localEnabled,
            endpoint: null,
            timeoutMs,
            reason: 'This browser does not support WebAssembly and no STEP backend is configured.',
        };
    }

    return {
        enabled: localEnabled || Boolean(endpoint),
        localEnabled,
        endpoint: endpoint || null,
        timeoutMs,
        reason: localEnabled
            ? 'Exact assembly STEP export runs locally in a background worker via OpenCascade WASM.'
            : 'Browser STEP export is unavailable, backend fallback will be used.',
    };
}
