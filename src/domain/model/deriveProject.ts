import type { PipeParameters } from '../../types';
import { buildAssemblySolidModel } from '../geometry/solids';
import type {
    DerivedConnection,
    DerivedPipeSpec,
    DerivedProject,
    ProjectInput,
} from './types';
import { validateProject } from './validation';

function derivePipe(od: number, wall: number): DerivedPipeSpec {
    const safeOd = Number.isFinite(od) ? od : 0;
    const safeWall = Number.isFinite(wall) ? wall : 0;
    const id = safeOd - safeWall * 2;

    return {
        od: safeOd,
        wall: safeWall,
        id,
        outerRadius: safeOd / 2,
        innerRadius: id / 2,
    };
}

function deriveConnection(project: ProjectInput, main: DerivedPipeSpec): DerivedConnection {
    const { connection } = project;
    const resolvedPenetrationDepth = connection.type === 'set_in'
        ? (connection.penetrationMode === 'by_value' ? connection.penetrationDepth : main.wall)
        : 0;

    return {
        ...connection,
        axisAngleRad: (connection.axisAngleDeg * Math.PI) / 180,
        resolvedPenetrationDepth,
    };
}

function buildGeometryParams(
    project: ProjectInput,
    main: DerivedPipeSpec,
    branch: DerivedPipeSpec,
    connection: DerivedConnection,
): PipeParameters {
    return {
        d1: main.od,
        d2: branch.od,
        d1Inner: main.id,
        d2Inner: branch.id,
        mainThickness: main.wall,
        thickness: branch.wall,
        angle: connection.axisAngleDeg,
        offset: connection.offset,
        weldingGap: connection.weldingGap,
        startAngle: connection.seamAngleDeg,
        paddingD1: project.export.mainPadding,
        paddingD2: project.export.branchPadding,
        calcByID: connection.useOuterBranchContour,
        connectionType: connection.type,
        penetrationMode: connection.penetrationMode,
        penetrationDepth: connection.resolvedPenetrationDepth,
    };
}

export function deriveProject(project: ProjectInput): DerivedProject {
    const main = derivePipe(project.main.od, project.main.wall);
    const branch = derivePipe(project.branch.od, project.branch.wall);
    const connection = deriveConnection(project, main);
    const receiverRadius = connection.type === 'set_in' ? main.innerRadius : main.outerRadius;
    const branchContourRadius = connection.useOuterBranchContour ? branch.outerRadius : branch.innerRadius;
    const maxOffset = Math.max(0, receiverRadius - Math.max(branchContourRadius, 0));
    const geometry = buildGeometryParams(project, main, branch, connection);
    const solids = buildAssemblySolidModel(main, branch, connection);
    const validation = validateProject({
        project,
        main,
        branch,
        connection,
        maxOffset,
        solids,
    });

    return {
        input: project,
        main,
        branch,
        connection,
        geometry,
        solids,
        limits: {
            maxOffset,
        },
        summary: {
            connectionLabel: connection.type === 'set_in' ? 'Set In' : 'Set On',
            branchTemplateLabel: 'Branch Template',
            holeTemplateLabel: 'Main Hole Template',
        },
        validation,
    };
}
