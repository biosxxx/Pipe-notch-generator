from __future__ import annotations

import unittest

from app.cad.evaluator import evaluate_step_export
from app.models.request_models import StepExportRequestModel


class StepEvaluatorTests(unittest.TestCase):
    def test_builds_assembly_definition_for_default_set_on_case(self) -> None:
        request = StepExportRequestModel.model_validate(
            {
                "version": 1,
                "project": {
                    "main": {"od": 100, "wall": 3},
                    "branch": {"od": 50, "wall": 2},
                    "connection": {
                        "type": "set_on",
                        "axisAngleDeg": 45,
                        "offset": 0,
                        "weldingGap": 0,
                        "seamAngleDeg": 0,
                        "penetrationMode": "by_rule",
                        "penetrationDepth": 3,
                        "useOuterBranchContour": True,
                    },
                },
                "exportOptions": {
                    "mode": "assembly",
                    "units": "mm",
                    "includeMain": True,
                    "includeBranch": True,
                    "includeFusedBody": False,
                },
            }
        )

        definition = evaluate_step_export(request)

        self.assertEqual(definition.assembly_name, "PipeNotchAssembly")
        self.assertEqual(definition.main.name, "MainPipe")
        self.assertEqual(definition.branch.name, "BranchPipe")
        self.assertEqual(definition.filename, "pipe_notch_set_on_50x2_on_100x3_45deg_assembly.step")


if __name__ == "__main__":
    unittest.main()
