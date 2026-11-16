"""
Internationalization (i18n) module for AloeMithra.
Loads translations from JSON files in the locales/ directory.
Supports fallback to English and dynamic language switching in Streamlit.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import streamlit as st
except ImportError:
    st = None  # Allow usage outside Streamlit (e.g. in standalone unit tests)

# Project base directory
BASE_DIR = Path(__file__).resolve().parent.parent
LOCALES_DIR = BASE_DIR / "locales"

# Available languages
SUPPORTED_LANGUAGES: Dict[str, str] = {
    "en": "English",
    "kn": "ಕನ್ನಡ (Kannada)",
    "hi": "हिन्दी (Hindi)",
}

DEFAULT_LANGUAGE = "en"
_translations_cache: Dict[str, Dict[str, Any]] = {}


def load_locale(lang: str) -> Dict[str, Any]:
    """Load JSON translations for a specific language code."""
    if lang in _translations_cache:
        return _translations_cache[lang]

    filepath = LOCALES_DIR / f"{lang}.json"
    if not filepath.exists():
        # Fallback to English if file not found
        filepath = LOCALES_DIR / f"{DEFAULT_LANGUAGE}.json"

    if filepath.exists():
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                _translations_cache[lang] = data
                return data
        except Exception:
            return {}
    return {}


def get_current_language() -> str:
    """Retrieve currently active language code from session state or default."""
    if st is not None and hasattr(st, "session_state"):
        if "language" not in st.session_state:
            st.session_state["language"] = DEFAULT_LANGUAGE
        return st.session_state["language"]
    return DEFAULT_LANGUAGE


def set_current_language(lang: str) -> None:
    """Set the active language code and persist to logged in user profile."""
    if lang not in SUPPORTED_LANGUAGES:
        lang = DEFAULT_LANGUAGE
    if st is not None and hasattr(st, "session_state"):
        st.session_state["language"] = lang
        # Sync with authenticated user profile if logged in
        if "user" in st.session_state and st.session_state["user"]:
            user = st.session_state["user"]
            user["language"] = lang
            try:
                from core.db import update_user_language
                update_user_language(user["id"], lang)
            except Exception:
                pass


def t(key: str, default: Optional[str] = None) -> str:
    """
    Translate a key string using the current active language.
    Falls back to English if the key is missing in the current language.
    """
    lang = get_current_language()
    translations = load_locale(lang)

    # Check key in current language
    if key in translations and translations[key]:
        return str(translations[key])

    # Fallback to English if different
    if lang != DEFAULT_LANGUAGE:
        en_translations = load_locale(DEFAULT_LANGUAGE)
        if key in en_translations and en_translations[key]:
            return str(en_translations[key])

    # Default fallback
    return default if default is not None else key


def render_language_selector() -> str:
    """Renders a language selector dropdown inside Streamlit sidebar."""
    if st is None:
        return DEFAULT_LANGUAGE

    current_lang = get_current_language()
    options = list(SUPPORTED_LANGUAGES.keys())
    current_index = options.index(current_lang) if current_lang in options else 0

    selected_lang = st.sidebar.selectbox(
        label=t("lbl_select_language", "Select Language / ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ / भाषा चुनें"),
        options=options,
        index=current_index,
        format_func=lambda code: SUPPORTED_LANGUAGES.get(code, code),
        key="language_selector_widget"
    )

    if selected_lang != current_lang:
        set_current_language(selected_lang)
        st.rerun()

    return selected_lang
