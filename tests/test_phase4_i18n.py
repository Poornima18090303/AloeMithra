"""
Unit tests for Phase 4: Internationalization, locale parity, and language persistence.
"""

import json
from pathlib import Path
import pytest

from core.i18n import (
    t,
    set_current_language,
    get_current_language,
    load_locale,
    SUPPORTED_LANGUAGES,
    LOCALES_DIR
)
from core.db import init_db, create_user, get_user_by_id
from core.auth import hash_password


def test_supported_languages_list():
    """Verify supported language codes."""
    assert "en" in SUPPORTED_LANGUAGES
    assert "kn" in SUPPORTED_LANGUAGES
    assert "hi" in SUPPORTED_LANGUAGES


def test_locale_keys_parity():
    """Verify that kn.json and hi.json have complete key parity with en.json."""
    en_path = LOCALES_DIR / "en.json"
    kn_path = LOCALES_DIR / "kn.json"
    hi_path = LOCALES_DIR / "hi.json"

    assert en_path.exists()
    assert kn_path.exists()
    assert hi_path.exists()

    with open(en_path, "r", encoding="utf-8") as f:
        en_data = json.load(f)
    with open(kn_path, "r", encoding="utf-8") as f:
        kn_data = json.load(f)
    with open(hi_path, "r", encoding="utf-8") as f:
        hi_data = json.load(f)

    en_keys = set(en_data.keys())
    # Exclude _meta marker from parity count
    kn_keys = set(kn_data.keys()) - {"_meta"}
    hi_keys = set(hi_data.keys()) - {"_meta"}

    missing_in_kn = en_keys - kn_keys
    missing_in_hi = en_keys - hi_keys

    assert len(missing_in_kn) == 0, f"Missing keys in kn.json: {missing_in_kn}"
    assert len(missing_in_hi) == 0, f"Missing keys in hi.json: {missing_in_hi}"


def test_native_review_markers():
    """Verify that kn.json and hi.json are marked with NEEDS_NATIVE_REVIEW."""
    with open(LOCALES_DIR / "kn.json", "r", encoding="utf-8") as f:
        kn_data = json.load(f)
    with open(LOCALES_DIR / "hi.json", "r", encoding="utf-8") as f:
        hi_data = json.load(f)

    assert kn_data.get("_meta") == "NEEDS_NATIVE_REVIEW"
    assert hi_data.get("_meta") == "NEEDS_NATIVE_REVIEW"


def test_dynamic_translation_and_fallback():
    """Test switching languages and verifying fallback behavior."""
    set_current_language("en")
    assert t("nav_home") == "Home"

    set_current_language("kn")
    assert "ಮುಖಪುಟ" in t("nav_home")

    set_current_language("hi")
    assert "होम" in t("nav_home")

    # Fallback test: Non-existent key should return default or key
    assert t("non_existent_key_12345", default="FallbackText") == "FallbackText"

    # Reset
    set_current_language("en")
