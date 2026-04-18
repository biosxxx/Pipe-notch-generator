from __future__ import annotations

import math

from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse

from ..cad.evaluator import evaluate_step_export
from ..cad.step.assembly_writer import export_step_assembly
from ..models.request_models import StepExportRequestModel
from ..models.response_models import StepExportException

router = APIRouter()


@router.post("/api/export/step")
def export_step(request: StepExportRequestModel):
    try:
        definition = evaluate_step_export(request)
        step_bytes = export_step_assembly(
            definition,
            axis_angle_rad=math.radians(request.project.connection.axisAngleDeg),
        )
    except StepExportException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_payload().model_dump(mode="json"),
        )

    return Response(
        content=step_bytes,
        media_type="application/step",
        headers={
            "content-disposition": f'attachment; filename="{definition.filename}"',
        },
    )
