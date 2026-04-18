import type { Point2D, PipeParameters } from '../types';
import { evaluateMainHoleUnrolledPoints } from '../domain/geometry/mainHoleTemplate';
import { evaluateReceiverTrimUnrolledPoints } from '../domain/geometry/receiverTrimPreview';
import { buildAssemblySolidModel } from '../domain/geometry/solids';
import type {
    DerivedConnection,
    DerivedPipeSpec,
    DerivedProject,
} from '../domain/model/types';

function derivePipeSpec(od: number, wall: number, id: number): DerivedPipeSpec {
    return {
        od,
        wall,
        id,
        outerRadius: od / 2,
        innerRadius: id / 2,
    };
}

function deriveConnection(params: PipeParameters): DerivedConnection {
    return {
        type: params.connectionType,
        axisAngleDeg: params.angle,
        axisAngleRad: (params.angle * Math.PI) / 180,
        offset: params.offset,
        weldingGap: params.weldingGap,
        seamAngleDeg: params.startAngle,
        penetrationMode: params.penetrationMode,
        penetrationDepth: params.penetrationDepth,
        resolvedPenetrationDepth: params.connectionType === 'set_in' ? params.penetrationDepth : 0,
        useOuterBranchContour: params.calcByID,
    };
}

function buildSolidModelFromParams(params: PipeParameters) {
    const main = derivePipeSpec(params.d1, params.mainThickness, params.d1Inner);
    const branch = derivePipeSpec(params.d2, params.thickness, params.d2Inner);
    const connection = deriveConnection(params);

    return buildAssemblySolidModel(main, branch, connection);
}

export function getExportPoints(
    type: 'pipe' | 'hole',
    params: PipeParameters,
    derivedProject?: DerivedProject,
): Point2D[] {
    const solidModel = derivedProject?.solids ?? buildSolidModelFromParams(params);
    if (type === 'hole') {
        return evaluateMainHoleUnrolledPoints(solidModel, params.paddingD1 || 0, 360);
    }

    return evaluateReceiverTrimUnrolledPoints(solidModel, params.startAngle, params.paddingD2 || 0, 360);
}
