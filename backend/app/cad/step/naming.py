from __future__ import annotations


ASSEMBLY_NAME = "PipeNotchAssembly"
MAIN_PART_NAME = "MainPipe"
BRANCH_PART_NAME = "BranchPipe"
FUSED_PART_NAME = "FusedBody"


def _format_number(value: float) -> str:
    rounded = round(value, 3)
    return f"{rounded:g}"


def build_step_filename(
    *,
    connection_type: str,
    branch_od: float,
    branch_wall: float,
    main_od: float,
    main_wall: float,
    axis_angle_deg: float,
) -> str:
    return (
        "pipe_notch_"
        f"{connection_type}_"
        f"{_format_number(branch_od)}x{_format_number(branch_wall)}_"
        f"on_{_format_number(main_od)}x{_format_number(main_wall)}_"
        f"{_format_number(axis_angle_deg)}deg_assembly.step"
    )
