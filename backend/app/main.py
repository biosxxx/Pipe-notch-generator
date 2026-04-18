from __future__ import annotations

from fastapi import FastAPI

from .api.step_export import router as step_export_router

app = FastAPI(
    title="Pipe Notch STEP Export",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(step_export_router)
