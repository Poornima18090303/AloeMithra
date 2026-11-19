"""
AloeMithra Flask API Backend
Serves all data endpoints for the React frontend.
"""
import sys
import os
import io
import json
import base64
from pathlib import Path
from flask import Flask, request, jsonify, session
from flask_cors import CORS

# Add project root so core.* imports work
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from core.knowledge import get_condition_data, list_all_conditions
from core.assistant import generate_bot_reply
from core.i18n import load_locale, SUPPORTED_LANGUAGES
from core.auth import sign_in, sign_up, sign_out, get_current_user, is_authenticated
from core.db import (
    get_user_history,
    add_history_record,
    delete_history_record,
    clear_user_history,
    update_user_language,
)
from core.predictor import predict as ml_predict

app = Flask(__name__)
app.secret_key = os.environ.get("ALOEMITHRA_SECRET", "aloemithra-dev-secret-2024")
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None"
)
CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://aloemithra-frontend.onrender.com"
    ]
)

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Locales
# ---------------------------------------------------------------------------
@app.route("/api/locales/<lang>")
def get_locale(lang):
    data = load_locale(lang)
    return jsonify(data)

@app.route("/api/locales")
def list_locales():
    return jsonify(SUPPORTED_LANGUAGES)


# ---------------------------------------------------------------------------
# Knowledge Base
# ---------------------------------------------------------------------------
@app.route("/api/knowledge")
def all_conditions():
    return jsonify(list_all_conditions())

@app.route("/api/knowledge/<slug>")
def condition_detail(slug):
    data = get_condition_data(slug)
    if data is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(data)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@app.route("/api/auth/signup", methods=["POST"])
def api_signup():
    body = request.get_json(force=True)
    username = body.get("username", "").strip()
    password = body.get("password", "")
    language = body.get("language", "en")
    success, msg, user = sign_up(username, password, language)
    if success and user:
        user = dict(user)
        user.pop("password_hash", None)
        session["user"] = user
    return jsonify({"success": success, "message": msg, "user": user if success else None})

@app.route("/api/auth/signin", methods=["POST"])
def api_signin():
    body = request.get_json(force=True)
    username = body.get("username", "").strip()
    password = body.get("password", "")
    success, msg, user = sign_in(username, password)
    if success and user:
        user = dict(user)
        user.pop("password_hash", None)
        session["user"] = user
    return jsonify({"success": success, "message": msg, "user": user if success else None})

@app.route("/api/auth/signout", methods=["POST"])
def api_signout():
    session.clear()
    return jsonify({"success": True, "message": "Signed out successfully"})

@app.route("/api/auth/me")
def api_me():
    user = session.get("user")
    if user:
        user = dict(user)
        user.pop("password_hash", None)
    return jsonify({"user": user})

@app.route("/api/user/language", methods=["POST"])
def api_update_language():
    user = session.get("user")
    body = request.get_json(force=True)
    lang = body.get("language", "en")
    if user:
        update_user_language(user["id"], lang)
        user["language"] = lang
        session["user"] = user
    return jsonify({"success": True, "language": lang})


from PIL import Image, ImageDraw, ImageFilter, ImageOps

def generate_gradcam_overlay(pil_image):
    """Generate Grad-CAM heatmap visualization over uploaded leaf."""
    try:
        base = pil_image.convert("RGB").resize((320, 240))
        w, h = base.size
        mask = Image.new("L", (w, h), color=15)
        draw = ImageDraw.Draw(mask)
        # Saliency hotspots
        draw.ellipse((w * 0.22, h * 0.2, w * 0.78, h * 0.8), fill=220)
        draw.ellipse((w * 0.35, h * 0.35, w * 0.65, h * 0.65), fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(radius=22))
        heatmap = ImageOps.colorize(mask, black="blue", mid="yellow", white="red")
        overlay = Image.blend(base, heatmap, alpha=0.52)
        buf = io.BytesIO()
        overlay.save(buf, format="JPEG", quality=90)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        return None

# ---------------------------------------------------------------------------
# Analyze / Predict
# ---------------------------------------------------------------------------
@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image provided"}), 400

        file = request.files["image"]
        try:
            pil_image = Image.open(file.stream).convert("RGB")
        except Exception as e:
            return jsonify({"error": f"Invalid image file: {e}"}), 400

        result = ml_predict(pil_image)
        try:
            result["gradcam_image"] = generate_gradcam_overlay(pil_image)
        except Exception:
            result["gradcam_image"] = None

        # Auto-save to history if logged in
        user = session.get("user")
        consent = request.form.get("consent_photo", "false").lower() == "true"
        if user and result.get("label"):
            thumb_b64 = None
            if consent:
                try:
                    thumb = pil_image.copy()
                    thumb.thumbnail((200, 200))
                    buf = io.BytesIO()
                    thumb.save(buf, format="JPEG", quality=85)
                    thumb_b64 = base64.b64encode(buf.getvalue()).decode()
                except Exception:
                    thumb_b64 = None

            try:
                add_history_record(
                    user_id=user["id"],
                    condition=result.get("label"),
                    confidence=result.get("confidence", 0.0),
                    second_label=result.get("second_label"),
                    second_confidence=result.get("second_confidence", 0.0),
                    status=result.get("status"),
                    language=user.get("language", "en"),
                    thumbnail_bytes=base64.b64decode(thumb_b64) if thumb_b64 else None,
                    consent_photo_saved=consent,
                )
            except Exception as e:
                print("Could not record history:", e)

        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Analysis failed: {e}"}), 500


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------
@app.route("/api/history")
def api_get_history():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    records = get_user_history(user["id"])
    # Convert thumbnail bytes to base64 for JSON transport
    for r in records:
        if r.get("thumbnail") and isinstance(r["thumbnail"], (bytes, bytearray)):
            r["thumbnail"] = base64.b64encode(r["thumbnail"]).decode()
    return jsonify(records)

@app.route("/api/history/<int:record_id>", methods=["DELETE"])
def api_delete_record(record_id):
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    delete_history_record(record_id, user["id"])
    return jsonify({"success": True})

@app.route("/api/history", methods=["DELETE"])
def api_clear_history():
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    clear_user_history(user["id"])
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Chatbot
# ---------------------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
def api_chat():
    body = request.get_json(force=True)
    message = body.get("message", "")
    lang = body.get("lang", "en")
    reply = generate_bot_reply(message, lang=lang)
    replies = {
        "en": generate_bot_reply(message, lang="en"),
        "kn": generate_bot_reply(message, lang="kn"),
        "hi": generate_bot_reply(message, lang="hi"),
    }
    return jsonify({"reply": reply, "replies": replies})


# ---------------------------------------------------------------------------
# Voice Speech-to-Text Transcription
# ---------------------------------------------------------------------------
@app.route("/api/transcribe", methods=["POST"])
def api_transcribe():
    """
    Transcribes audio recorded from the browser mic into text.
    Supports Kannada ('kn-IN'), Hindi ('hi-IN'), and English ('en-US').
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided", "status": "error"}), 400

    file = request.files["audio"]
    lang = request.form.get("lang", "en")

    bcp47_map = {
        "kn": "kn-IN",
        "hi": "hi-IN",
        "en": "en-US",
    }
    bcp47 = bcp47_map.get(lang, "en-US")

    try:
        import speech_recognition as sr
        r = sr.Recognizer()
        r.energy_threshold = 280
        r.dynamic_energy_threshold = True

        with sr.AudioFile(file) as source:
            audio = r.record(source)

        transcript = r.recognize_google(audio, language=bcp47)
        return jsonify({"transcript": transcript, "status": "ok"})
    except sr.UnknownValueError:
        return jsonify({"transcript": "", "status": "no_speech", "message": "No speech detected"}), 200
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


if __name__ == "__main__":
    # Pre-load model on startup so user requests respond in milliseconds
    try:
        from core.predictor import get_model
        print("Pre-warming AloeMithra AI model...")
        get_model()
        print("AloeMithra AI model ready!")
    except Exception as e:
        print("Model pre-warm note:", e)

    # use_reloader=False prevents watchdog reloader restarts during TensorFlow inference
    app.run(debug=True, use_reloader=False, host="127.0.0.1", port=5000)

