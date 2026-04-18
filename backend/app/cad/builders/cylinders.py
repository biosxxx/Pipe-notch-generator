from __future__ import annotations

from ...models.response_models import StepExportException
from ..dto import AxialRange, EvaluatedPipeBody, Frame3D
from .booleans import subtract_shape
from .frames import point_along_axis, to_tuple
from .trims import sample_branch_notch_curve


def load_cadquery():
    try:
        import cadquery as cq  # type: ignore
    except ModuleNotFoundError as exc:  # pragma: no cover - depends on local runtime
        raise StepExportException(
            "cad_runtime_unavailable",
            "CadQuery/OpenCascade runtime is not installed. Use Python 3.12 and install backend dependencies.",
            status_code=503,
        ) from exc

    return cq


def build_solid_cylinder(frame: Frame3D, axial_range: AxialRange, radius: float):
    cq = load_cadquery()
    height = axial_range.end - axial_range.start
    if radius <= 0 or height <= 0:
        raise StepExportException(
            "invalid_dimensions",
            "Cylinder dimensions must be greater than 0.",
        )

    start = point_along_axis(frame, axial_range.start)
    return cq.Solid.makeCylinder(
        radius,
        height,
        pnt=to_tuple(start),
        dir=to_tuple(frame.axis),
    )


def build_hollow_cylinder(frame: Frame3D, axial_range: AxialRange, outer_radius: float, inner_radius: float):
    outer = build_solid_cylinder(frame, axial_range, outer_radius)
    if inner_radius <= 0:
        return outer

    clearance = max(1.0, outer_radius * 0.02)
    inner = build_solid_cylinder(
        frame,
        AxialRange(axial_range.start - clearance, axial_range.end + clearance),
        inner_radius,
    )
    return subtract_shape(outer, inner, part_name="PipeBody", label="inner bore")


def build_main_pipe_body(body: EvaluatedPipeBody):
    shell = build_hollow_cylinder(
        body.frame,
        body.axial_range,
        body.outer_diameter / 2.0,
        body.inner_diameter / 2.0,
    )

    if body.opening_subtract is None:
        return shell

    tool = build_solid_cylinder(
        body.opening_subtract.frame,
        body.opening_subtract.axial_range,
        body.opening_subtract.radius,
    )
    return subtract_shape(shell, tool, part_name=body.name, label="opening tool")


def build_branch_pipe_body(body: EvaluatedPipeBody, *, axis_angle_rad: float):
    cq = load_cadquery()
    notch = body.receiver_notch
    if notch is None:
        return build_hollow_cylinder(
            body.frame,
            body.axial_range,
            body.outer_diameter / 2.0,
            body.inner_diameter / 2.0,
        )

    outer_curve_points = sample_branch_notch_curve(
        body.frame,
        notch,
        axis_angle_rad=axis_angle_rad,
        branch_mesh_radius=notch.branch_outer_radius,
    )
    inner_curve_points = sample_branch_notch_curve(
        body.frame,
        notch,
        axis_angle_rad=axis_angle_rad,
        branch_mesh_radius=notch.branch_inner_radius,
    )

    outer_curve = cq.Wire.assembleEdges([
        cq.Edge.makeSpline([to_tuple(point) for point in outer_curve_points], periodic=True),
    ])
    inner_curve = cq.Wire.assembleEdges([
        cq.Edge.makeSpline([to_tuple(point) for point in inner_curve_points], periodic=True),
    ])

    far_outer = cq.Wire.makeCircle(
        notch.branch_outer_radius,
        to_tuple(point_along_axis(body.frame, notch.far_end_axial)),
        to_tuple(body.frame.axis),
    )
    far_inner = cq.Wire.makeCircle(
        notch.branch_inner_radius,
        to_tuple(point_along_axis(body.frame, notch.far_end_axial)),
        to_tuple(body.frame.axis),
    )

    try:
        outer_solid = cq.Solid.makeLoft([outer_curve, far_outer])
        inner_void = cq.Solid.makeLoft([inner_curve, far_inner])
    except Exception as exc:  # pragma: no cover - depends on CAD kernel runtime
        raise StepExportException(
            "body_generation_failure",
            "Failed to build branch notch body.",
            details={"part": body.name},
        ) from exc

    return subtract_shape(outer_solid, inner_void, part_name=body.name, label="branch bore")
