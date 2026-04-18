from __future__ import annotations

import math

from ..dto import Frame3D, Vec3


def vec3(x: float, y: float, z: float) -> Vec3:
    return Vec3(x=x, y=y, z=z)


def add_vec3(a: Vec3, b: Vec3) -> Vec3:
    return vec3(a.x + b.x, a.y + b.y, a.z + b.z)


def sub_vec3(a: Vec3, b: Vec3) -> Vec3:
    return vec3(a.x - b.x, a.y - b.y, a.z - b.z)


def scale_vec3(value: Vec3, factor: float) -> Vec3:
    return vec3(value.x * factor, value.y * factor, value.z * factor)


def dot_vec3(a: Vec3, b: Vec3) -> float:
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z)


def cross_vec3(a: Vec3, b: Vec3) -> Vec3:
    return vec3(
        (a.y * b.z) - (a.z * b.y),
        (a.z * b.x) - (a.x * b.z),
        (a.x * b.y) - (a.y * b.x),
    )


def length_vec3(value: Vec3) -> float:
    return math.sqrt(dot_vec3(value, value))


def normalize_vec3(value: Vec3, fallback: Vec3 | None = None) -> Vec3:
    fallback_value = fallback or vec3(0.0, 1.0, 0.0)
    length = length_vec3(value)
    if length < 1e-9:
        return fallback_value

    return scale_vec3(value, 1.0 / length)


def orthogonalize(reference: Vec3, axis: Vec3) -> Vec3:
    return sub_vec3(reference, scale_vec3(axis, dot_vec3(reference, axis)))


def create_frame(origin: Vec3, axis: Vec3, up_hint: Vec3 | None = None) -> Frame3D:
    safe_axis = normalize_vec3(axis, vec3(0.0, 1.0, 0.0))
    projected_up = orthogonalize(up_hint or vec3(0.0, 0.0, 1.0), safe_axis)
    fallback_up = vec3(1.0, 0.0, 0.0) if abs(safe_axis.z) > 0.9 else vec3(0.0, 0.0, 1.0)
    safe_up = normalize_vec3(
        projected_up,
        normalize_vec3(orthogonalize(fallback_up, safe_axis), vec3(1.0, 0.0, 0.0)),
    )
    binormal = normalize_vec3(cross_vec3(safe_axis, safe_up), vec3(1.0, 0.0, 0.0))
    normal = normalize_vec3(cross_vec3(binormal, safe_axis), safe_up)

    return Frame3D(
        origin=origin,
        axis=safe_axis,
        normal=normal,
        binormal=binormal,
    )


def point_along_axis(frame: Frame3D, distance: float) -> Vec3:
    return add_vec3(frame.origin, scale_vec3(frame.axis, distance))


def get_frame_tangent(frame: Frame3D) -> Vec3:
    return vec3(-frame.binormal.x, -frame.binormal.y, -frame.binormal.z)


def sample_point_on_frame(
    frame: Frame3D,
    axial_offset: float,
    *,
    normal_offset: float = 0.0,
    tangent_offset: float = 0.0,
) -> Vec3:
    tangent = get_frame_tangent(frame)
    return add_vec3(
        add_vec3(
            add_vec3(frame.origin, scale_vec3(frame.axis, axial_offset)),
            scale_vec3(frame.normal, normal_offset),
        ),
        scale_vec3(tangent, tangent_offset),
    )


def to_tuple(value: Vec3) -> tuple[float, float, float]:
    return (value.x, value.y, value.z)
