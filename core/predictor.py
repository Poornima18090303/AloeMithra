
"""
Predictor integration layer for AloeMithra.

Prediction contract:

predict(PIL_image) -> dict:
  - status: "confident" | "possible" | "retake_low_confidence" | "retake_no_leaf"
  - confidence: float (0.0 to 1.0)
  - label: str (omitted when status == "retake_low_confidence")
  - second_label: str
  - second_confidence: float (0.0 to 1.0)
  - probabilities: dict[str, float]
"""

import traceback
from pathlib import Path
from typing import Dict, Any, Optional

from PIL import Image


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR / "models" / "effb0_224_fullft_noweights.keras"
)

CLASSES = [
    "Aloe Rust",
    "Anthracnose",
    "Healthy",
    "Leaf Spot",
    "Sunburn"
]

_model = None

MODEL_LOAD_ERROR: Optional[str] = None
MODEL_LOAD_STATUS: str = "NOT_LOADED"


# --------------------------------------------------
# LOAD TRAINED MODEL
# --------------------------------------------------

def get_model():
    """
    Load the trained Keras model.
    Cache the model after successful loading.
    """

    global _model
    global MODEL_LOAD_ERROR
    global MODEL_LOAD_STATUS

    if _model is not None:
        return _model

    if not MODEL_PATH.exists():

        MODEL_LOAD_ERROR = (
            f"Model file not found at: {MODEL_PATH}"
        )

        MODEL_LOAD_STATUS = "FILE_NOT_FOUND"

        print(MODEL_LOAD_ERROR)

        return None

    try:

        import keras

        print(f"Loading model from: {MODEL_PATH}")

        _model = keras.models.load_model(
            str(MODEL_PATH)
        )

        MODEL_LOAD_STATUS = "LOADED_SUCCESSFULLY"
        MODEL_LOAD_ERROR = None

        print("AloeMithra model loaded successfully.")

        return _model

    except Exception:

        MODEL_LOAD_STATUS = "LOAD_FAILED"

        MODEL_LOAD_ERROR = traceback.format_exc()

        print("MODEL LOADING ERROR:")
        print(MODEL_LOAD_ERROR)

        return None


# --------------------------------------------------
# IMAGE PREDICTION
# --------------------------------------------------

def predict(image: Image.Image) -> Dict[str, Any]:
    """
    Predict Aloe vera leaf condition from a PIL image.

    Uses the existing trained EfficientNetB0 model.
    """

    global MODEL_LOAD_ERROR
    global MODEL_LOAD_STATUS

    model = get_model()

    # Check whether model loaded successfully
    if model is not None:

        try:

            import numpy as np

            # --------------------------------------
            # IMAGE PREPROCESSING
            # --------------------------------------

            img_resized = (
                image.convert("RGB")
                .resize((224, 224))
            )

            img_array = np.array(
                img_resized,
                dtype=np.float32
            )

            img_batch = np.expand_dims(
                img_array,
                axis=0
            )

            # --------------------------------------
            # MODEL INFERENCE
            # --------------------------------------

            raw_preds = model.predict(
                img_batch,
                verbose=0
            )[0]

            # Validate model output
            if len(raw_preds) != len(CLASSES):

                raise ValueError(
                    f"Expected {len(CLASSES)} predictions, "
                    f"but received {len(raw_preds)}."
                )

            if not np.all(np.isfinite(raw_preds)):

                raise ValueError(
                    "Model returned invalid prediction values."
                )

            # --------------------------------------
            # PROBABILITY MAPPING
            # --------------------------------------

            prob_dict = {
                CLASSES[i]: float(raw_preds[i])
                for i in range(len(CLASSES))
            }

            sorted_classes = sorted(
                prob_dict.items(),
                key=lambda x: x[1],
                reverse=True
            )

            top_label, top_conf = sorted_classes[0]

            sec_label, sec_conf = sorted_classes[1]

            # --------------------------------------
            # CONFIDENCE CLASSIFICATION
            # --------------------------------------

            if top_conf >= 0.70:

                status = "confident"

            elif top_conf >= 0.45:

                status = "possible"

            else:

                status = "retake_low_confidence"

            # --------------------------------------
            # BUILD RESPONSE
            # --------------------------------------

            result = {
                "status": status,
                "confidence": float(top_conf),
                "second_label": sec_label,
                "second_confidence": float(sec_conf),
                "probabilities": prob_dict
            }

            if status != "retake_low_confidence":

                result["label"] = top_label

            print(
                f"Prediction: {top_label} | "
                f"Confidence: {top_conf:.4f} | "
                f"Status: {status}"
            )

            return result

        except Exception:

            MODEL_LOAD_STATUS = "PREDICTION_FAILED"

            MODEL_LOAD_ERROR = traceback.format_exc()

            print("PREDICTION ERROR:")
            print(MODEL_LOAD_ERROR)

    # ----------------------------------------------
    # SAFE FALLBACK RESPONSE
    # ----------------------------------------------

    return {
        "status": "retake_low_confidence",

        "confidence": 0.35,

        "second_label": "Healthy",

        "second_confidence": 0.25,

        "probabilities": {
            cls_name: 0.20
            for cls_name in CLASSES
        },

        "diagnostic_note": (
            f"Model status: {MODEL_LOAD_STATUS}. "
            f"{MODEL_LOAD_ERROR if MODEL_LOAD_ERROR else 'Model unavailable.'}"
        )
    }
