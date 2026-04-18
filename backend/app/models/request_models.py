from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PipeSpecModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    od: float = Field(gt=0)
    wall: float = Field(gt=0)


class ConnectionModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["set_on", "set_in"]
    axisAngleDeg: float
    offset: float
    weldingGap: float
    seamAngleDeg: float
    penetrationMode: Literal["by_rule", "by_value"]
    penetrationDepth: float
    useOuterBranchContour: bool


class ProjectModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    main: PipeSpecModel
    branch: PipeSpecModel
    connection: ConnectionModel


class ExportOptionsModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["assembly"]
    units: Literal["mm"]
    includeMain: Literal[True]
    includeBranch: Literal[True]
    includeFusedBody: bool = False


class StepExportRequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: Literal[1]
    project: ProjectModel
    exportOptions: ExportOptionsModel
