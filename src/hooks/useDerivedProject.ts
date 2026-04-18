import { useMemo } from 'react';
import { deriveProject } from '../domain/model/deriveProject';
import { useProjectStore } from '../store/useProjectStore';

export function useDerivedProject() {
    const project = useProjectStore((state) => state.project);
    return useMemo(() => deriveProject(project), [project]);
}
