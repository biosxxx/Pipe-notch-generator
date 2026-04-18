from __future__ import annotations

from ...models.response_models import StepExportException


def subtract_shape(target, tool, *, part_name: str, label: str):
    try:
        result = target.cut(tool)
    except Exception as exc:  # pragma: no cover - depends on CAD kernel runtime
        raise StepExportException(
            "boolean_failure",
            f"Failed to subtract {label} from {part_name}.",
            details={"part": part_name},
        ) from exc

    if result is None:
        raise StepExportException(
            "boolean_failure",
            f"Failed to subtract {label} from {part_name}.",
            details={"part": part_name},
        )

    return result


def fuse_shapes(left, right, *, part_name: str):
    try:
        result = left.fuse(right)
    except Exception as exc:  # pragma: no cover - depends on CAD kernel runtime
        raise StepExportException(
            "boolean_failure",
            f"Failed to fuse {part_name}.",
            details={"part": part_name},
        ) from exc

    if result is None:
        raise StepExportException(
            "boolean_failure",
            f"Failed to fuse {part_name}.",
            details={"part": part_name},
        )

    return result
