from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class StepExportMetaModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    units: Literal["mm"]
    parts: list[Literal["MainPipe", "BranchPipe", "FusedBody"]] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class StepExportResponseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    filename: str
    mimeType: Literal["model/step", "application/step", "application/octet-stream"]
    fileBytesBase64: str | None = None
    downloadUrl: str | None = None
    meta: StepExportMetaModel


class StepExportErrorModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    details: dict[str, Any] | None = None


class StepExportErrorPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: StepExportErrorModel


class StepExportException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        *,
        details: dict[str, Any] | None = None,
        status_code: int = 400,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code

    def to_payload(self) -> StepExportErrorPayload:
        return StepExportErrorPayload(
            error=StepExportErrorModel(
                code=self.code,
                message=self.message,
                details=self.details or None,
            ),
        )
