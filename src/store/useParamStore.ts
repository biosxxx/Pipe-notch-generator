import { create } from 'zustand';
import type { PipeParameters } from '../types';

interface UIState {
    errorMessage: string | null;
    sidebarCollapsed: boolean;
    setErrorMessage: (msg: string | null) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

interface ParamState extends PipeParameters, UIState {
    updateParam: (key: keyof PipeParameters, value: number | boolean) => void;
    resetParams: () => void;
}

const DEFAULT_PARAMS: PipeParameters = {
    d1: 100,
    d2: 50,
    thickness: 2, // Changed to 2 as per screenshot prompt details (D2: 50, T: 2)
    angle: 45,
    offset: 0,
    weldingGap: 0,
    startAngle: 0,
    paddingD1: 20,
    paddingD2: 20,
    calcByID: true,
};

export const useParamStore = create<ParamState>((set) => ({
    ...DEFAULT_PARAMS,
    errorMessage: null,
    sidebarCollapsed: false,

    updateParam: (key, value) => set((state) => ({ ...state, [key]: value })),
    resetParams: () => set((state) => ({ ...state, ...DEFAULT_PARAMS })),
    setErrorMessage: (msg) =>
        set((state) => (state.errorMessage === msg ? state : { ...state, errorMessage: msg })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
