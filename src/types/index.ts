export interface PipeParameters {
    d1: number;
    d2: number;
    thickness: number;
    angle: number;
    offset: number;
    weldingGap: number; // Renamed from gap
    startAngle: number;
    paddingD1: number;
    paddingD2: number;
    calcByID: boolean;
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
