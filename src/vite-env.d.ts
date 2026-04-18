/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
    readonly VITE_STEP_EXPORT_URL?: string;
    readonly VITE_STEP_EXPORT_TIMEOUT_MS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module 'replicad-opencascadejs' {
    const initReplicadOpenCascade: (options?: {
        locateFile?: (path: string, prefix?: string) => string;
    }) => Promise<unknown>;

    export default initReplicadOpenCascade;
}

declare module 'replicad-opencascadejs/src/replicad_single.wasm?url' {
    const wasmUrl: string;
    export default wasmUrl;
}
