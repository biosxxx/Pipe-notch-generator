from __future__ import annotations

from ...models.response_models import StepExportException


def validate_solid(shape, *, part_name: str):
    if shape is None:
        raise StepExportException(
            "invalid_solid",
            f"{part_name} did not produce a solid body.",
            details={"part": part_name},
        )

    is_valid = getattr(shape, "isValid", None)
    if callable(is_valid) and not shape.isValid():
        raise StepExportException(
            "invalid_solid",
            f"{part_name} solid is invalid.",
            details={"part": part_name},
        )

    volume = getattr(shape, "Volume", None)
    if callable(volume) and shape.Volume() <= 0:
        raise StepExportException(
            "invalid_solid",
            f"{part_name} solid has zero or negative volume.",
            details={"part": part_name},
        )

    return shape
