# Pipe Notch Generator — Full CAD-Grade STEP Assembly Export Specification

## 1. Document purpose

This document is a full implementation brief for an engineering agent to add **exact 3D STEP assembly export** to the `Pipe-notch-generator` project.

The target is **not** a fake STEP wrapper around preview meshes and **not** a simplified visualization surrogate. The target is a **CAD-importable assembly** that can be opened in systems such as **SolidWorks**, where the imported parts can be inspected as proper tubular bodies, used to cross-check the generated notch / hole geometry, and compared against the application's DXF outputs.

The implementation must preserve the current browser-first Vite/React experience for parameter editing and 3D preview, while introducing a separate **evaluated exact-geometry export path** for STEP generation.

---

## 2. Current repository state confirmed from code

The current branch already introduced a `SolidModel` intent layer, but it does **not** yet contain evaluated final solids or B-Rep topology.

### Confirmed facts from the repository

- The project is a **Vite + React + TypeScript** app. `package.json` uses `vite`, `react`, `three`, `@react-three/fiber`, and `vitest`, with no CAD kernel currently present. fileciteturn42file0L1-L1
- `logchange.md` explicitly states that the new `SolidModel` layer was introduced and that the next step is `STEP export` via a separate solid/export layer rather than fake serialization. fileciteturn28file0L1-L1
- `src/domain/geometry/solids.ts` currently stores only:
  - primitives,
  - trims,
  - boolean intent,
  - output ids,
  but **not** evaluated final bodies. fileciteturn35file0L1-L1
- In `solids.ts`, the main receiver and branch are represented as hollow-cylinder primitives, and the opening is represented as a solid-cylinder tool used only as boolean intent. fileciteturn35file0L1-L1
- `MainPipe.tsx` renders the main pipe as two open cylinders (outer and inner surfaces) for preview. It is **not** a finished boolean-cut solid body. fileciteturn36file0L1-L1
- `BranchPipe.tsx` renders a triangulated preview mesh built from `evaluateReceiverTrimPreview(...)`, again for visualization only. fileciteturn37file0L1-L1
- `receiverTrimPreview.ts` computes vertices, indices, UVs, cut curve, and unrolled points, which is suitable for preview / DXF logic, but not a CAD B-Rep export. fileciteturn38file0L1-L1
- `useDownloadAction.ts` currently supports only `'dxf' | 'pdf'`. There is no STEP pipeline yet. fileciteturn39file0L1-L1
- `Sidebar.tsx` explicitly states that STEP export is disabled until the STEP serializer and CAD boolean backend are implemented. fileciteturn40file0L1-L1
- `validation.ts` currently validates intersection / template geometry, but not watertight 3D bodies or valid STEP-ready solids. fileciteturn41file0L1-L1
- `DerivedProject` currently includes `solids: SolidModel`, which means the right extension point already exists in the domain model. fileciteturn43file0L1-L1

---

## 3. Engineering goal

Implement **exact STEP export of a 3D assembly** consisting of:

1. **Main pipe part** with a real cut opening.
2. **Branch pipe part** with a real notch cut.
3. Both parts exported into a **single assembly STEP file**.
4. The export must be sufficiently exact for import into CAD software such as SolidWorks for:
   - visual inspection,
   - checking fit-up,
   - comparing against generated DXF outlines,
   - possible downstream conversion attempts to sheet-metal style workflows.

### Important clarification

The objective is **assembly STEP**, not only a fused final welded lump.

That means the exported result must preserve **at least two exact part bodies**:
- `main_pipe.step body`
- `branch_pipe.step body`

Optionally, later phases may also add:
- a fused welded-body export,
- separate per-part STEP download,
- neutral exchange for additional CAD targets.

---

## 4. Recommended technology choice

## Recommended primary stack

### Frontend / existing app
- Keep current stack:
  - Vite
  - React
  - TypeScript
  - Zustand
  - Three.js / react-three-fiber

### Exact CAD export backend
- **Python service with OpenCascade-based modeling**
- Recommended implementation:
  - **FastAPI** for the export endpoint
  - **CadQuery** (or OCP/OpenCascade directly) for exact B-Rep generation
  - STEP export through OpenCascade STEP writer

## Why this is the best fit

This project already uses TypeScript in the browser, but the new requirement is **not UI rendering**. It is **exact solid modeling + boolean operations + STEP serialization**.

For that job, the most practical path is:
- keep the browser for editing / preview / local DXF logic,
- move exact CAD generation into a dedicated export service.

This gives:
- robust boolean operations,
- real B-Rep solids,
- manageable bundle size,
- easier regression testing,
- easier future support for IGES / separate part STEP / welded union export.

## Why OpenSCAD is **not** recommended as the main solution

OpenSCAD is not the right primary technology for this requirement because:
- it is centered around script-driven CSG rather than engineering-grade topological workflows,
- boolean and topology control are less suitable for downstream CAD-quality part validation,
- it is a poor fit for a future pipeline that may need exact surfaces, shell validation, named part export, and CAD interoperability checks,
- it does not align well with a need for robust exact assembly-level export and future manufacturing-oriented verification.

OpenSCAD may be acceptable only as a quick experimental prototype, but **must not be chosen as the target architecture**.

## Alternative allowed option

If a backend is absolutely impossible, the second-best option is:
- **OpenCascade.js / opencascade.wasm** in a dedicated worker or export module.

However, this is **not preferred** because:
- it increases frontend bundle size,
- it complicates memory handling in the browser,
- it is harder to debug,
- it increases risk in production for heavy exports.

---

## 5. Target architecture

The architecture should be split into **three layers**.

## Layer A — Intent model (already exists)
This layer remains browser-native and should continue to describe *what should be built*.

Existing example:
- `src/domain/geometry/solids.ts`

Responsibility:
- primitives,
- trim intent,
- boolean intent,
- output ids.

This layer should remain lightweight and deterministic.

## Layer B — Evaluated exact geometry layer (new)
This is the missing layer.

Responsibility:
- convert `SolidModel` intent into exact evaluated part definitions,
- resolve final radii, axis systems, trim surfaces, opening tool geometry,
- produce exact geometric instructions for CAD kernel execution,
- define assembly-level positioning.

This layer should be independent from UI and independent from STEP serialization.

## Layer C — CAD / STEP export layer (new)
Responsibility:
- build exact B-Rep bodies using the evaluated layer,
- perform booleans,
- validate resulting bodies,
- serialize assembly STEP,
- return the file to the frontend.

---

## 6. Export target definition

## Required export mode for first release

### Primary output
- **Assembly STEP** containing:
  - `MainPipe`
  - `BranchPipe`

### Geometry requirements
- main pipe must contain a **real opening**,
- branch pipe must contain a **real notch cut**,
- both must be **exact tubular solids**, not meshes,
- each part must be **closed / watertight**, not open shells,
- units must be **millimeters**,
- placement / axes must match the application geometry.

## Recommended assembly structure
- Assembly root: `PipeNotchAssembly`
- Components:
  - `MainPipe`
  - `BranchPipe`

## Optional outputs for later phases
- `MainPipe.step`
- `BranchPipe.step`
- `PipeNotchWelded.step` (union result)
- ZIP bundle containing per-part + assembly STEP

---

## 7. Data contract between frontend and backend

The frontend should **not** send preview mesh data.

The frontend should send a compact exact export request derived from domain values.

## Request DTO

Suggested TypeScript contract:

```ts
export interface StepExportRequest {
  version: 1;
  project: {
    main: {
      od: number;
      wall: number;
    };
    branch: {
      od: number;
      wall: number;
    };
    connection: {
      type: 'set_on' | 'set_in';
      axisAngleDeg: number;
      offset: number;
      weldingGap: number;
      seamAngleDeg: number;
      penetrationMode: 'by_rule' | 'by_value';
      penetrationDepth: number;
      useOuterBranchContour: boolean;
    };
  };
  exportOptions: {
    mode: 'assembly';
    units: 'mm';
    includeMain: true;
    includeBranch: true;
    includeFusedBody?: boolean;
  };
}
```

## Response

```ts
export interface StepExportResponse {
  filename: string;
  mimeType: 'model/step' | 'application/step' | 'application/octet-stream';
  fileBytesBase64?: string;
  downloadUrl?: string;
  meta: {
    units: 'mm';
    parts: Array<'MainPipe' | 'BranchPipe' | 'FusedBody'>;
    warnings: string[];
  };
}
```

---

## 8. Recommended repository structure

## Frontend additions

```text
src/
  domain/
    geometry/
      solids.ts                       # keep as intent layer
    export/
      step/
        types.ts                      # DTOs for request/response/options
        buildStepExportPayload.ts     # convert DerivedProject -> request payload
        stepDownload.ts               # browser download helper
        stepCapability.ts             # feature flags / backend availability
  hooks/
    useDownloadAction.ts              # extend to support 'step'
  features/
    controls/
      Sidebar.tsx                     # enable STEP button and status UI
  core/
    validation/
      stepReadiness.ts                # pre-export browser validation
```

## Backend additions (new service recommended)

```text
backend/
  app/
    main.py                           # FastAPI app
    api/
      step_export.py                  # POST /api/export/step
    models/
      request_models.py               # Pydantic request models
      response_models.py              # response models
    cad/
      dto.py                          # evaluated geometry DTOs
      evaluator.py                    # request -> evaluated bodies instructions
      builders/
        frames.py                     # axis/frame helpers
        cylinders.py                  # pipe body builders
        trims.py                      # notch/opening curve calculations
        booleans.py                   # subtract/union wrappers
        validation.py                 # OCC body checks
      step/
        assembly_writer.py            # assembly STEP writer
        naming.py                     # part names, product names
    tests/
      test_step_set_on.py
      test_step_set_in.py
      test_step_limits.py
      test_step_roundtrip_contract.py
```

---

## 9. Exact geometry modeling strategy

## 9.1 Main pipe body

Create an exact hollow cylindrical pipe body:
- axis = main axis,
- OD = main.od,
- ID = main.id,
- finite stock length = controlled export length.

### Required modeling method
- build outer cylinder solid,
- build inner cylinder solid,
- subtract inner from outer,
- trim to export stock length.

### Main opening
Then create the opening tool aligned to the branch axis and subtract it from the main pipe.

Important:
- opening diameter must follow the same contour logic used by the domain rules,
- `set_on` / `set_in` behavior must be consistent with current intent semantics,
- this is an **exact subtract**, not only a preview guide.

## 9.2 Branch pipe body

Create an exact hollow branch pipe body:
- axis = branch axis,
- OD = branch.od,
- ID = branch.id,
- finite stock length = export length determined by evaluated model.

### Branch notch
The branch end must be trimmed using exact notch geometry equivalent to the receiver contact logic.

This must generate:
- real outer cut edge,
- real inner cut edge,
- real end face / shell closure behavior,
- exact solid after trim.

The current preview evaluator already encodes the notch contour math in `receiverTrimPreview.ts`; that mathematical logic should be **reused as the source for contour definition**, but **not reused as the final solid representation**. fileciteturn38file0L1-L1

## 9.3 Assembly placement

Place both bodies into a common assembly coordinate frame matching the frontend.

Suggested convention:
- Main axis = global Y
- Lateral offset = global Z
- Secondary cross direction = global X

This should follow the same frame conventions already used in the current geometry layer and viewer transforms. fileciteturn35file0L1-L1

---

## 10. CAD kernel implementation details

## 10.1 Required operations

The CAD backend must support:
- exact cylinder creation,
- shell / wall subtraction,
- oriented workplanes / local frames,
- exact boolean subtract,
- exact boolean union for optional fused output,
- STEP assembly writing with part names,
- body validation.

## 10.2 CadQuery / OCC implementation approach

### Main pipe
1. Build outer solid cylinder.
2. Build inner solid cylinder.
3. Subtract inner from outer.
4. Build opening tool along branch axis.
5. Subtract opening tool from main pipe.

### Branch pipe
1. Build outer solid cylinder.
2. Build inner solid cylinder.
3. Subtract inner from outer.
4. Build notch trimming surface / trimming tool based on evaluated contour.
5. Subtract / split / trim to obtain exact branch end.

## 10.3 How to model the notch exactly

There are two allowed implementation approaches.

### Preferred approach
Construct the notch as an exact trimming operation using receiver-cylinder intersection logic.

This may be implemented by:
- generating an exact cutter body representing the receiver intersection zone,
- subtracting that from branch stock,
- then trimming branch length with the far-end plane.

### Acceptable fallback for phase 1
Construct an exact loft / ruled surface from sampled cut curves with enough parametric fidelity to produce a valid B-Rep, then trim and sew into a closed solid.

Important:
- this fallback is acceptable only if the resulting body is a valid exact CAD body,
- it must **not** degrade into STL-like faceting exported as fake STEP.

---

## 11. Evaluated geometry layer design

A new evaluated layer must sit between `SolidModel` and CAD export.

## Suggested evaluated types

### TypeScript-side conceptual types

```ts
export interface EvaluatedAssemblyDefinition {
  units: 'mm';
  main: EvaluatedPipeBody;
  branch: EvaluatedPipeBody;
  placement: {
    mainFrame: Frame3D;
    branchFrame: Frame3D;
  };
  options: {
    includeFusedBody: boolean;
  };
}

export interface EvaluatedPipeBody {
  name: string;
  outerDiameter: number;
  innerDiameter: number;
  stockLength: number;
  trims: EvaluatedTrim[];
}

export type EvaluatedTrim =
  | EvaluatedPlaneTrim
  | EvaluatedReceiverNotchTrim
  | EvaluatedOpeningSubtract;
```

### Python-side equivalent DTOs
Keep a 1:1 equivalent to prevent ambiguity.

## Key rule
`solids.ts` remains the **intent model**.

Do **not** overload it with backend-specific B-Rep objects.

---

## 12. Frontend changes required

## 12.1 Extend export format support

Current `useDownloadAction.ts` supports only `'dxf' | 'pdf'`. fileciteturn39file0L1-L1

It must be extended to:

```ts
format: 'dxf' | 'pdf' | 'step'
```

### New behavior
- if format = `step`:
  - run step-readiness validation,
  - build export payload from `DerivedProject`,
  - call backend,
  - receive file,
  - trigger download.

## 12.2 Add export payload builder

Create:
- `src/domain/export/step/buildStepExportPayload.ts`

This function must:
- take `DerivedProject`,
- build normalized export payload,
- enforce mm units,
- include connection mode and penetration settings,
- not include preview meshes.

## 12.3 Sidebar UI

`Sidebar.tsx` currently shows STEP as disabled text only. fileciteturn40file0L1-L1

Replace with real controls:
- `Assembly STEP`
- optionally later `Main STEP`, `Branch STEP`

### Button behavior
- disabled if validation fails,
- disabled if backend unavailable,
- show progress state during export,
- show failure reason on server / geometry error.

## 12.4 Capability flag

Create:
- `src/domain/export/step/stepCapability.ts`

This should define:
- backend URL,
- feature enabled / disabled,
- timeout,
- max request size if needed.

---

## 13. Backend API requirements

## Endpoint

`POST /api/export/step`

## Input
- exact project geometry DTO

## Output
- binary STEP file or temporary download URL

## Error categories
The backend must return structured errors for:
- invalid dimensions,
- invalid intersection,
- boolean failure,
- non-manifold result,
- self-intersection,
- unsupported export case,
- internal CAD kernel failure.

### Suggested error response

```json
{
  "error": {
    "code": "boolean_failure",
    "message": "Failed to subtract opening tool from main pipe.",
    "details": {
      "part": "MainPipe"
    }
  }
}
```

---

## 14. Validation requirements

Current validation only proves the geometry is acceptable for notch / hole calculations, not for exact STEP solids. fileciteturn41file0L1-L1

A new validation stage must be added.

## 14.1 Browser-side pre-export validation

Purpose:
- fail fast before API call.

Checks:
- OD > 0,
- wall > 0,
- ID > 0,
- angle in valid range,
- offset within valid range,
- penetration consistent,
- existing domain validation passes.

## 14.2 Backend exact-body validation

Required checks:
- resulting main body is valid,
- resulting branch body is valid,
- bodies are closed solids,
- no self-intersections,
- no null boolean result,
- units in mm,
- coordinate placement valid,
- assembly contains named components.

## 14.3 Export-readiness function

Create frontend file:
- `src/core/validation/stepReadiness.ts`

Return:
- `isReady`
- `errors[]`
- `warnings[]`

---

## 15. Regression and test strategy

This feature must be test-driven with both mathematical and export-level checks.

## 15.1 Existing tests to preserve
The current branch already contains new geometry tests and test-only legacy references. Those must stay green during the refactor. Compare output indicates new tests under `src/core/__tests__` and `src/domain/geometry`. fileciteturn34file0L1-L1

## 15.2 New frontend tests

Add tests for:
- `buildStepExportPayload`
- `stepReadiness`
- `useDownloadAction` step branch
- button enabled / disabled states in `Sidebar`

## 15.3 Backend tests

Minimum exact export scenarios:

1. `set_on`, centered
2. `set_on`, offset near geometric limit
3. `set_in`, by_rule penetration
4. `set_in`, by_value penetration
5. branch contour by OD
6. branch contour by ID
7. thin-wall edge case that should still export
8. invalid case that must fail cleanly

## 15.4 Golden files

Store golden artifacts for selected scenarios:
- golden STEP assembly files,
- optional exported metadata snapshots,
- optional section / bounding-box snapshots.

Do **not** compare raw entire STEP text byte-for-byte if timestamps or entity numbering are unstable.

Instead compare:
- part count,
- body validity,
- bounding boxes,
- reference dimensions,
- named products present.

---

## 16. Implementation phases

## Phase 0 — Architecture lock

Deliverables:
- confirm export target = **assembly STEP**,
- confirm exact B-Rep required,
- confirm backend route chosen = **Python + CadQuery/OCC**,
- freeze coordinate conventions,
- freeze export stock-length strategy.

## Phase 1 — Frontend export contract

Tasks:
- create step DTOs,
- create payload builder,
- extend `useDownloadAction.ts`,
- add `Assembly STEP` button in `Sidebar.tsx`,
- add pre-export readiness validation,
- add loading / error UI.

Acceptance:
- frontend can produce valid JSON export payload,
- button state follows validation state,
- API integration path is wired.

## Phase 2 — Backend scaffold

Tasks:
- create FastAPI service,
- define request/response models,
- add `/api/export/step`,
- add smoke test.

Acceptance:
- endpoint accepts payload and returns placeholder response,
- contract tests pass.

## Phase 3 — Exact evaluated geometry layer

Tasks:
- convert project DTO into evaluated main/branch exact body definitions,
- normalize all derived dimensions,
- preserve `set_on` / `set_in` semantics,
- encode opening / notch instructions independently from UI.

Acceptance:
- evaluator produces deterministic exact export definitions,
- unit tests cover all connection modes.

## Phase 4 — Main pipe exact body

Tasks:
- build exact tubular main pipe,
- subtract opening tool,
- validate result.

Acceptance:
- exported main part is a valid closed solid with a real opening.

## Phase 5 — Branch exact body

Tasks:
- build exact tubular branch,
- trim real notch,
- validate result.

Acceptance:
- exported branch part is a valid closed solid with a real notch.

## Phase 6 — Assembly STEP writing

Tasks:
- place both parts in assembly,
- write assembly STEP,
- assign product names,
- return file to frontend.

Acceptance:
- SolidWorks imports the assembly with two parts in correct relative position.

## Phase 7 — QA / regression / DXF cross-check workflow

Tasks:
- define reference cases,
- import STEP into SolidWorks,
- compare notch / opening geometry to current DXF outputs,
- document discrepancies.

Acceptance:
- engineering review confirms STEP geometry is suitable for validating DXF correctness.

---

## 17. Stock-length policy

The exported parts need finite length. That policy must be explicit.

## Recommended rule for phase 1

### Main pipe stock length
Use a stable export stock length such as:
- `max(main.od * 3, branch.od * 2 + 200)`

### Branch pipe stock length
Use a stable export stock length such as:
- sufficient insertion + visible extension,
- preserve current semantic intent from the domain model,
- but make it deterministic and documented.

The stock-length rule must be centralized and covered by tests.

---

## 18. Coordinate and naming conventions

## Units
- millimeters only

## Axes
- main axis aligned to project convention already used in domain/viewer
- branch axis derived from `axisAngleDeg` and `offset`

## STEP naming
- assembly name: `PipeNotchAssembly`
- component names:
  - `MainPipe`
  - `BranchPipe`

## Download filename
Suggested:

```text
pipe_notch_<set_on|set_in>_<branchOD>x<branchWall>_on_<mainOD>x<mainWall>_<angle>deg_assembly.step
```

---

## 19. Acceptance criteria

The feature is accepted only if all points below are true.

1. The export is a real **STEP assembly**, not a mesh wrapper.
2. The assembly contains separate exact parts for main and branch.
3. The main part has a real opening.
4. The branch part has a real notch.
5. Both parts are valid closed solids.
6. The export is generated from the new exact export layer, not from Three.js preview geometry.
7. The UI supports STEP export through the same download flow family as DXF/PDF.
8. Geometry errors fail with useful messages.
9. Regression tests cover `set_on`, `set_in`, offset limits, OD/ID contour choices, and penetration modes.
10. The exported file imports into SolidWorks in a way suitable for engineering verification of the generated DXF logic.

---

## 20. Explicit non-goals for phase 1

The following are not required in the first implementation unless specifically approved:

- browser-only exact B-Rep generation,
- OpenSCAD-based production export path,
- sheet-metal feature recognition inside SolidWorks,
- automatic conversion of imported STEP into native sheet-metal features,
- weld bead solids,
- manufacturing metadata / PMI,
- multi-branch assemblies,
- bevel / coping / weld prep geometry.

The first milestone is exact importable assembly geometry for validation and comparison.

---

## 21. Practical recommendation to the engineering agent

## Final recommended path

Use this implementation order:

1. **Keep the current `SolidModel` as intent only.**
2. **Add a new evaluated exact export layer.**
3. **Implement a separate backend service using FastAPI + CadQuery/OpenCascade.**
4. **Generate exact main and branch solids there.**
5. **Write assembly STEP there.**
6. **Integrate frontend STEP download only after backend contract is stable.**
7. **Use imported STEP in SolidWorks as the verification tool against current DXF output.**

## Explicit technology decision

### Choose:
- **Python + FastAPI + CadQuery/OpenCascade** for exact STEP export.

### Do not choose as the main production path:
- OpenSCAD
- fake STEP from preview mesh
- direct serialization of Three.js geometry

---

## 22. Suggested first engineering tasks list

1. Create `src/domain/export/step/types.ts`
2. Create `src/domain/export/step/buildStepExportPayload.ts`
3. Create `src/core/validation/stepReadiness.ts`
4. Extend `src/hooks/useDownloadAction.ts` to support `step`
5. Update `src/features/controls/Sidebar.tsx` to expose `Assembly STEP`
6. Create `backend/app/main.py`
7. Create `backend/app/api/step_export.py`
8. Create `backend/app/cad/evaluator.py`
9. Create `backend/app/cad/builders/cylinders.py`
10. Create `backend/app/cad/builders/booleans.py`
11. Create `backend/app/cad/step/assembly_writer.py`
12. Add backend geometry validation tests
13. Add frontend contract tests
14. Add golden export cases
15. Perform manual SolidWorks import verification

---

## 23. Final engineering note

The current repository state is actually a good foundation for this work:
- the app already has a clean Vite/React base,
- the new `SolidModel` intent layer is the correct precursor,
- the preview and export math paths are already being unified.

What is still missing is the **exact evaluated CAD layer** and the **real STEP backend**.

That is the correct next step.

