import type { ProjectInput } from './types';

export const DEFAULT_PROJECT: ProjectInput = {
    main: {
        od: 100,
        wall: 3,
    },
    branch: {
        od: 50,
        wall: 2,
    },
    connection: {
        type: 'set_on',
        axisAngleDeg: 45,
        offset: 0,
        weldingGap: 0,
        seamAngleDeg: 0,
        penetrationMode: 'by_rule',
        penetrationDepth: 3,
        useOuterBranchContour: true,
    },
    export: {
        branchPadding: 20,
        mainPadding: 20,
    },
};
