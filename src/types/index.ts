export interface PipeParameters {
    d1: number;
    d2: number;
    d1Inner: number;
    d2Inner: number;
    mainThickness: number;
    thickness: number;
    angle: number;
    offset: number;
    weldingGap: number;
    startAngle: number;
    paddingD1: number;
    paddingD2: number;
    calcByID: boolean;
    connectionType: 'set_on' | 'set_in';
    penetrationMode: 'by_rule' | 'by_value';
    penetrationDepth: number;
}

export interface Point3D {
    x: number;
    y: number;
    z: number;
}

export interface Point2D {
    x: number;
    y: number;
}
