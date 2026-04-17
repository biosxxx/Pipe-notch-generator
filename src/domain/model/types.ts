import type { PipeParameters } from '../../types';
import type { SolidModel } from '../geometry/solids';

export type ConnectionType = 'set_on' | 'set_in';
export type PenetrationMode = 'by_rule' | 'by_value';
export type ValidationSeverity = 'error' | 'warning';

export interface PipeInput {
    od: number;
    wall: number;
}

export interface ConnectionInput {
    type: ConnectionType;
    axisAngleDeg: number;
    offset: number;
    weldingGap: number;
    seamAngleDeg: number;
    penetrationMode: PenetrationMode;
    penetrationDepth: number;
    useOuterBranchContour: boolean;
}

export interface ExportInput {
    branchPadding: number;
    mainPadding: number;
}

export interface ProjectInput {
    main: PipeInput;
    branch: PipeInput;
    connection: ConnectionInput;
    export: ExportInput;
}

export interface ValidationMessage {
    severity: ValidationSeverity;
    code: string;
    message: string;
}

export interface DerivedPipeSpec extends PipeInput {
    id: number;
    outerRadius: number;
    innerRadius: number;
}

export interface DerivedConnection extends ConnectionInput {
    axisAngleRad: number;
    resolvedPenetrationDepth: number;
}

export interface ValidationSummary {
    errors: ValidationMessage[];
    warnings: ValidationMessage[];
    isValid: boolean;
}

export interface DerivedProject {
    input: ProjectInput;
    main: DerivedPipeSpec;
    branch: DerivedPipeSpec;
    connection: DerivedConnection;
    geometry: PipeParameters;
    solids: SolidModel;
    limits: {
        maxOffset: number;
    };
    summary: {
        connectionLabel: string;
        branchTemplateLabel: string;
        holeTemplateLabel: string;
    };
    validation: ValidationSummary;
}
