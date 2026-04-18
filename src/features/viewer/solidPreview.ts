import * as THREE from 'three';
import type { Frame3D } from '../../domain/geometry/frame';
import type {
    HollowCylinderPrimitive,
    SolidModel,
    SolidPrimitive,
} from '../../domain/geometry/solids';
import { addVec3, dotVec3, scaleVec3, subVec3, type Vec3 } from '../../domain/geometry/vector';

export interface FrameTransform {
    position: [number, number, number];
    quaternion: THREE.Quaternion;
}

export interface SolidBounds {
    center: [number, number, number];
    size: number;
    min: Vec3;
    max: Vec3;
}

function vecToThree(value: Vec3) {
    return new THREE.Vector3(value.x, value.y, value.z);
}

export function getFrameTangent(frame: Frame3D): Vec3 {
    return {
        x: -frame.binormal.x,
        y: -frame.binormal.y,
        z: -frame.binormal.z,
    };
}

export function createFrameTransform(frame: Frame3D): FrameTransform {
    const tangent = getFrameTangent(frame);
    const basis = new THREE.Matrix4().makeBasis(
        vecToThree(tangent),
        vecToThree(frame.normal),
        vecToThree(frame.axis),
    );
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);

    return {
        position: [frame.origin.x, frame.origin.y, frame.origin.z],
        quaternion,
    };
}

export function projectWorldPointToFrameLocal(point: Vec3, frame: Frame3D): THREE.Vector3 {
    const tangent = getFrameTangent(frame);
    const delta = subVec3(point, frame.origin);

    return new THREE.Vector3(
        dotVec3(delta, tangent),
        dotVec3(delta, frame.normal),
        dotVec3(delta, frame.axis),
    );
}

export function samplePointOnFrame(
    frame: Frame3D,
    axialOffset: number,
    normalOffset: number = 0,
    tangentOffset: number = 0,
): [number, number, number] {
    const tangent = getFrameTangent(frame);
    const point = addVec3(
        addVec3(
            addVec3(frame.origin, scaleVec3(frame.axis, axialOffset)),
            scaleVec3(frame.normal, normalOffset),
        ),
        scaleVec3(tangent, tangentOffset),
    );

    return [point.x, point.y, point.z];
}

export function getPrimitiveLength(primitive: SolidPrimitive) {
    return primitive.axialRange.end - primitive.axialRange.start;
}

export function getPrimitiveRadius(primitive: SolidPrimitive) {
    return primitive.kind === 'hollow-cylinder' ? primitive.outerRadius : primitive.radius;
}

function expandBounds(bounds: { min: Vec3; max: Vec3 }, point: Vec3) {
    bounds.min.x = Math.min(bounds.min.x, point.x);
    bounds.min.y = Math.min(bounds.min.y, point.y);
    bounds.min.z = Math.min(bounds.min.z, point.z);
    bounds.max.x = Math.max(bounds.max.x, point.x);
    bounds.max.y = Math.max(bounds.max.y, point.y);
    bounds.max.z = Math.max(bounds.max.z, point.z);
}

function samplePrimitiveBounds(primitive: HollowCylinderPrimitive | SolidPrimitive, bounds: { min: Vec3; max: Vec3 }) {
    const radius = getPrimitiveRadius(primitive);
    const tangent = getFrameTangent(primitive.frame);
    const axialSamples = [primitive.axialRange.start, primitive.axialRange.end];
    const radialSigns = [-1, 1];

    axialSamples.forEach((axial) => {
        const axisPoint = addVec3(primitive.frame.origin, scaleVec3(primitive.frame.axis, axial));

        radialSigns.forEach((normalSign) => {
            radialSigns.forEach((tangentSign) => {
                const corner = addVec3(
                    addVec3(axisPoint, scaleVec3(primitive.frame.normal, radius * normalSign)),
                    scaleVec3(tangent, radius * tangentSign),
                );

                expandBounds(bounds, corner);
            });
        });
    });
}

export function estimateSolidModelBounds(model: SolidModel): SolidBounds {
    const bounds = {
        min: { x: Infinity, y: Infinity, z: Infinity },
        max: { x: -Infinity, y: -Infinity, z: -Infinity },
    };

    model.primitives.forEach((primitive) => {
        samplePrimitiveBounds(primitive, bounds);
    });

    const min = Number.isFinite(bounds.min.x) ? bounds.min : { x: -50, y: -50, z: -50 };
    const max = Number.isFinite(bounds.max.x) ? bounds.max : { x: 50, y: 50, z: 50 };
    const size = Math.max(max.x - min.x, max.y - min.y, max.z - min.z);

    return {
        center: [
            (min.x + max.x) / 2,
            (min.y + max.y) / 2,
            (min.z + max.z) / 2,
        ],
        size,
        min,
        max,
    };
}
