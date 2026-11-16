"""
Tests for status handling and knowledge base contracts using a fake predictor.
Runs completely independent of GPU/TensorFlow model files.
"""

import pytest
from PIL import Image

from core.knowledge import get_condition_data
from core.i18n import t, set_current_language, get_current_language


class FakePredictor:
    """Mock predictor simulating various image inference outcomes."""

    @staticmethod
    def predict_confident(image):
        return {
            "status": "confident",
            "confidence": 0.94,
            "label": "Aloe Rust",
            "second_label": "Leaf Spot",
            "second_confidence": 0.04,
            "probabilities": {
                "Aloe Rust": 0.94,
                "Leaf Spot": 0.04,
                "Anthracnose": 0.01,
                "Sunburn": 0.005,
                "Healthy": 0.005,
            }
        }

    @staticmethod
    def predict_possible(image):
        return {
            "status": "possible",
            "confidence": 0.62,
            "label": "Anthracnose",
            "second_label": "Leaf Spot",
            "second_confidence": 0.28,
            "probabilities": {
                "Anthracnose": 0.62,
                "Leaf Spot": 0.28,
                "Aloe Rust": 0.05,
                "Sunburn": 0.03,
                "Healthy": 0.02,
            }
        }

    @staticmethod
    def predict_low_confidence(image):
        # Strict contract: label must be absent when status is retake_low_confidence
        return {
            "status": "retake_low_confidence",
            "confidence": 0.32,
            "second_label": "Healthy",
            "second_confidence": 0.29,
            "probabilities": {
                "Healthy": 0.29,
                "Leaf Spot": 0.25,
                "Sunburn": 0.20,
                "Aloe Rust": 0.15,
                "Anthracnose": 0.11,
            }
        }

    @staticmethod
    def predict_no_leaf(image):
        return {
            "status": "retake_no_leaf",
            "confidence": 0.05,
            "second_label": "",
            "second_confidence": 0.0,
            "probabilities": {}
        }


@pytest.fixture
def dummy_image():
    """Provides a dummy 100x100 RGB image."""
    return Image.new("RGB", (100, 100), color=(34, 139, 34))


def test_status_confident(dummy_image):
    result = FakePredictor.predict_confident(dummy_image)
    assert result["status"] == "confident"
    assert result["confidence"] >= 0.70
    assert "label" in result
    assert result["label"] == "Aloe Rust"

    # Verify knowledge base contains this condition
    kb = get_condition_data(result["label"])
    assert kb is not None
    assert kb["status"] == "DRAFT_NEEDS_EXPERT_REVIEW"
    assert "sanitation" in kb["management"]
    assert "cultural" in kb["management"]


def test_status_possible(dummy_image):
    result = FakePredictor.predict_possible(dummy_image)
    assert result["status"] == "possible"
    assert 0.40 <= result["confidence"] < 0.70
    assert "label" in result
    assert "second_label" in result
    assert result["second_confidence"] > 0.0


def test_status_retake_low_confidence(dummy_image):
    result = FakePredictor.predict_low_confidence(dummy_image)
    assert result["status"] == "retake_low_confidence"
    assert result["confidence"] < 0.45
    # Strict rule: label must NOT be present to prevent premature diagnosis
    assert "label" not in result

    # Check that i18n text matches the mandatory text
    low_conf_msg = t("status_retake_low_conf")
    assert "The prediction confidence is low." in low_conf_msg
    assert "consult an agricultural expert" in low_conf_msg


def test_status_retake_no_leaf(dummy_image):
    result = FakePredictor.predict_no_leaf(dummy_image)
    assert result["status"] == "retake_no_leaf"
    assert result["confidence"] < 0.20


def test_safety_sunburn_no_fungicide():
    """Sunburn is environmental, never fungal: verify no fungicides suggested."""
    kb = get_condition_data("Sunburn")
    assert kb is not None
    assert kb["type"] == "environmental"
    text_content = str(kb).lower()
    assert "fungicide" not in text_content or "do not treat with fungicides" in text_content
    # Must advise protecting from harsh midday sun
    cultural_text = " ".join([item["step"] for item in kb["management"]["cultural"]])
    assert "sun" in cultural_text.lower()


def test_safety_healthy_preventive_only():
    """Healthy condition should only have preventive care and no treatment."""
    kb = get_condition_data("Healthy")
    assert kb is not None
    assert kb["type"] == "healthy"
    # Biological and chemical should have the placeholder
    for cat in ["biological", "chemical"]:
        steps = kb["management"][cat]
        assert len(steps) > 0
        assert "To be added from reviewed research sources." in steps[0]["step"]


def test_all_classes_have_draft_status():
    """All 5 classes must have status DRAFT_NEEDS_EXPERT_REVIEW and placeholder chem/bio."""
    classes = ["Aloe Rust", "Anthracnose", "Healthy", "Leaf Spot", "Sunburn"]
    for c in classes:
        kb = get_condition_data(c)
        assert kb is not None, f"Missing knowledge base for {c}"
        assert kb["status"] == "DRAFT_NEEDS_EXPERT_REVIEW"
        assert kb["management"]["biological"][0]["step"] == "To be added from reviewed research sources."
        assert kb["management"]["chemical"][0]["step"] == "To be added from reviewed research sources."


def test_i18n_locales():
    """Verify locale loading and fallback behavior."""
    set_current_language("en")
    assert t("app_title") == "AloeMithra"

    set_current_language("kn")
    assert "NEEDS_NATIVE_REVIEW" in t("app_title")

    set_current_language("hi")
    assert "NEEDS_NATIVE_REVIEW" in t("app_title")

    # Reset
    set_current_language("en")
