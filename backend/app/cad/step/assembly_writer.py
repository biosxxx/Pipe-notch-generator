from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory

from ...models.response_models import StepExportException
from ..builders.booleans import fuse_shapes
from ..builders.cylinders import build_branch_pipe_body, build_main_pipe_body, load_cadquery
from ..builders.validation import validate_solid
from ..dto import EvaluatedAssemblyDefinition
from .naming import FUSED_PART_NAME


def export_step_assembly(definition: EvaluatedAssemblyDefinition, *, axis_angle_rad: float) -> bytes:
    cq = load_cadquery()

    main_body = validate_solid(build_main_pipe_body(definition.main), part_name=definition.main.name)
    branch_body = validate_solid(
        build_branch_pipe_body(definition.branch, axis_angle_rad=axis_angle_rad),
        part_name=definition.branch.name,
    )

    assembly = cq.Assembly(name=definition.assembly_name)
    assembly.add(main_body, name=definition.main.name, color=cq.Color(0.42, 0.46, 0.52))
    assembly.add(branch_body, name=definition.branch.name, color=cq.Color(0.18, 0.49, 1.0))

    if definition.include_fused_body:
        fused = validate_solid(
            fuse_shapes(main_body, branch_body, part_name=FUSED_PART_NAME),
            part_name=FUSED_PART_NAME,
        )
        assembly.add(fused, name=FUSED_PART_NAME, color=cq.Color(0.74, 0.74, 0.74))

    try:
        with TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / definition.filename
            assembly.export(str(output_path))
            return output_path.read_bytes()
    except StepExportException:
        raise
    except Exception as exc:  # pragma: no cover - depends on CAD kernel runtime
        raise StepExportException(
            "step_write_failure",
            "Failed to serialize STEP assembly.",
            details={"assembly": definition.assembly_name},
        ) from exc
