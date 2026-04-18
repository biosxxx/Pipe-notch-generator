# STEP export backend

This backend provides the exact CAD export path described in `pipe-notch-step-assembly-implementation-spec.md`.

## Runtime

- Preferred Python: `3.12.x`
- The project is intentionally isolated from the Vite frontend runtime.
- `cadquery` is loaded lazily by the CAD builder layer so the API can still report a structured error if the CAD kernel is not installed.

## Local setup

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

Then configure the frontend with:

```bash
VITE_STEP_EXPORT_URL=http://localhost:8000/api/export/step
```
