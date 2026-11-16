"""
End-to-End integration tests for Phase 5:
Verifying multi-page structure, About page mandatory limitations, and predictor decoupling.
"""

from pathlib import Path
import pytest
from PIL import Image

from core.predictor import predict, CLASSES
from core.knowledge import list_all_conditions
from core.db import init_db

BASE_DIR = Path(__file__).resolve().parent.parent


def test_project_multipage_structure():
    """Verify that all application pages and assets exist."""
    assert (BASE_DIR / "app.py").exists()
    assert (BASE_DIR / "pages" / "1_Analyze.py").exists()
    assert (BASE_DIR / "pages" / "2_History.py").exists()
    assert (BASE_DIR / "pages" / "3_About.py").exists()
    assert (BASE_DIR / "assets" / "style.css").exists()
    assert (BASE_DIR / "assets" / "logo.png").exists()
    assert (BASE_DIR / "assets" / "bg.jpg").exists()
    assert (BASE_DIR / "requirements.txt").exists()
    assert (BASE_DIR / "README.md").exists()


def test_about_page_mandatory_disclosures():
    """About page must plainly state validation accuracy (83%) and background limitations."""
    about_path = BASE_DIR / "pages" / "3_About.py"
    content = about_path.read_text(encoding="utf-8")

    assert "83%" in content, "Must disclose 83% validation accuracy."
    assert "dark background" in content.lower(), "Must state dark background training condition."
    assert "natural background" in content.lower(), "Must state untested on natural background condition."


def test_predictor_contract_compliance():
    """Predictor contract returns dict with required keys."""
    dummy_img = Image.new("RGB", (224, 224), color=(34, 139, 34))
    res = predict(dummy_img)

    assert isinstance(res, dict)
    assert "status" in res
    assert res["status"] in ["confident", "possible", "retake_low_confidence", "retake_no_leaf"]
    assert "confidence" in res and isinstance(res["confidence"], float)
    assert "second_label" in res
    assert "second_confidence" in res and isinstance(res["second_confidence"], float)
    assert "probabilities" in res and isinstance(res["probabilities"], dict)

    # If status is retake_low_confidence, label must be omitted
    if res["status"] == "retake_low_confidence":
        assert "label" not in res


def test_classes_coverage():
    """All 5 defined classes must have a corresponding knowledge-base profile."""
    conditions = list_all_conditions()
    kb_conditions = {c["condition"] for c in conditions}
    for cls_name in CLASSES:
        assert cls_name in kb_conditions, f"Class {cls_name} missing from knowledge base."
