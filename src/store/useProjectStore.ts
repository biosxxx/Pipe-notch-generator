import { create } from 'zustand';
import { DEFAULT_PROJECT } from '../domain/model/defaults';
import type { ConnectionInput, ExportInput, PipeInput, ProjectInput } from '../domain/model/types';

interface ProjectStoreState {
    project: ProjectInput;
    sidebarCollapsed: boolean;
    updateMain: (key: keyof PipeInput, value: number) => void;
    updateBranch: (key: keyof PipeInput, value: number) => void;
    updateConnection: (key: keyof ConnectionInput, value: ConnectionInput[keyof ConnectionInput]) => void;
    updateExport: (key: keyof ExportInput, value: number) => void;
    resetProject: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
    project: DEFAULT_PROJECT,
    sidebarCollapsed: false,

    updateMain: (key, value) => set((state) => ({
        ...state,
        project: {
            ...state.project,
            main: {
                ...state.project.main,
                [key]: value,
            },
        },
    })),
    updateBranch: (key, value) => set((state) => ({
        ...state,
        project: {
            ...state.project,
            branch: {
                ...state.project.branch,
                [key]: value,
            },
        },
    })),
    updateConnection: (key, value) => set((state) => ({
        ...state,
        project: {
            ...state.project,
            connection: {
                ...state.project.connection,
                [key]: value,
            },
        },
    })),
    updateExport: (key, value) => set((state) => ({
        ...state,
        project: {
            ...state.project,
            export: {
                ...state.project.export,
                [key]: value,
            },
        },
    })),
    resetProject: () => set((state) => ({
        ...state,
        project: DEFAULT_PROJECT,
    })),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
