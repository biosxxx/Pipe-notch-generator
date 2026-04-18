from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


@dataclass(frozen=True)
class Vec3:
    x: float
    y: float
    z: float


@dataclass(frozen=True)
class AxialRange:
    start: float
    end: float


@dataclass(frozen=True)
class Frame3D:
    origin: Vec3
    axis: Vec3
    normal: Vec3
    binormal: Vec3


@dataclass(frozen=True)
class EvaluatedPlaneTrim:
    id: str
    label: str
    keep_side: Literal["greater", "less"]
    offset: float


@dataclass(frozen=True)
class EvaluatedOpeningSubtract:
    radius: float
    frame: Frame3D
    axial_range: AxialRange


@dataclass(frozen=True)
class EvaluatedReceiverNotchTrim:
    receiver_surface: Literal["main-outer", "main-inner"]
    branch_contour_surface: Literal["branch-outer", "branch-inner"]
    receiver_radius: float
    trim_contour_radius: float
    branch_outer_radius: float
    branch_inner_radius: float
    offset: float
    welding_gap: float
    penetration_depth: float
    far_end_axial: float


@dataclass(frozen=True)
class EvaluatedPipeBody:
    name: str
    outer_diameter: float
    inner_diameter: float
    frame: Frame3D
    axial_range: AxialRange
    plane_trims: list[EvaluatedPlaneTrim] = field(default_factory=list)
    opening_subtract: EvaluatedOpeningSubtract | None = None
    receiver_notch: EvaluatedReceiverNotchTrim | None = None


@dataclass(frozen=True)
class EvaluatedAssemblyDefinition:
    units: Literal["mm"]
    assembly_name: str
    filename: str
    main: EvaluatedPipeBody
    branch: EvaluatedPipeBody
    include_fused_body: bool
    warnings: list[str] = field(default_factory=list)
