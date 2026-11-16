"""
History & Accounts Page for AloeMithra.
(Matching Screen 2 & Screen 7 of Mobile App Mockup)
"""

from pathlib import Path
import io
import textwrap
import streamlit as st
from PIL import Image

from core.i18n import t, render_language_selector, SUPPORTED_LANGUAGES, get_current_language
from core.auth import (
    sign_in,
    sign_up,
    sign_out,
    get_current_user,
    is_authenticated
)
from core.db import (
    get_user_history,
    delete_history_record,
    clear_user_history
)

st.set_page_config(
    page_title="Saved History - AloeMithra",
    page_icon="📜",
    layout="centered",
    initial_sidebar_state="collapsed"
)

def md(html_text: str):
    """Safely render HTML without markdown codeblock indentation issues."""
    st.markdown(textwrap.dedent(html_text).strip(), unsafe_allow_html=True)

# Load CSS
assets_dir = Path(__file__).parent.parent / "assets"
css_file = assets_dir / "style.css"
if css_file.exists():
    with open(css_file, "r", encoding="utf-8") as f:
        md(f"<style>{f.read()}</style>")

# Sidebar
st.sidebar.markdown("## 🌿 **AloeMithra**")
st.sidebar.caption("Detect • Understand • Nurture")
render_language_selector()
st.sidebar.divider()

user = get_current_user()

if is_authenticated():
    st.sidebar.success(f"👤 Logged in as: **{user['username']}**")
    if st.sidebar.button("🚪 Logout", use_container_width=True):
        sign_out()
        st.rerun()

# =============================================================================
# SCENARIO A: LOGGED OUT -> MATCHING SCREEN 2 (WELCOME BACK AUTH)
# =============================================================================
if not is_authenticated():
    md(
        """
        <div style="text-align: center; margin-top: 0.5rem; margin-bottom: 1.2rem;">
            <span style="font-size: 3.2rem; display: block; margin-bottom: 4px;">🪴</span>
            <h2 style="color: #163e23; font-size: 1.6rem; font-weight: 700; margin: 0;">
                Welcome Back!
            </h2>
            <p style="color: #4a7054; font-size: 0.95rem; margin: 4px 0 0 0;">
                Let's keep your Aloe Vera healthy together 🌱
            </p>
        </div>
        """
    )

    tab_signin, tab_signup = st.tabs(["Sign In", "Sign Up"])

    with tab_signin:
        with st.form("signin_form", clear_on_submit=False):
            username_in = st.text_input("Username", key="signin_user", placeholder="Enter your username")
            password_in = st.text_input("Password", type="password", key="signin_pwd", placeholder="Enter your password")
            submit_signin = st.form_submit_button("Sign In →", type="primary", use_container_width=True)

            if submit_signin:
                success, msg, logged_user = sign_in(username_in, password_in)
                if success:
                    st.success(msg)
                    st.rerun()
                else:
                    st.error(msg)

    with tab_signup:
        with st.form("signup_form", clear_on_submit=False):
            username_up = st.text_input("Username", key="signup_user", placeholder="Choose a username")
            password_up = st.text_input("Password", type="password", key="signup_pwd", placeholder="Create password (min 6 chars)")
            
            current_lang = get_current_language()
            lang_options = list(SUPPORTED_LANGUAGES.keys())
            lang_idx = lang_options.index(current_lang) if current_lang in lang_options else 0
            
            preferred_lang = st.selectbox(
                "Preferred Language",
                options=lang_options,
                index=lang_idx,
                format_func=lambda code: SUPPORTED_LANGUAGES.get(code, code)
            )

            st.caption("🔒 Passwords are encrypted with bcrypt. Photos are saved only with your consent.")
            submit_signup = st.form_submit_button("Create Account →", type="primary", use_container_width=True)

            if submit_signup:
                success, msg, new_user = sign_up(username_up, password_up, preferred_lang)
                if success:
                    st.success(msg)
                    st.rerun()
                else:
                    st.error(msg)

    md(
        """
        <div style="text-align: center; margin-top: 1.8rem;">
            <p class="heart-slogan" style="font-size: 1.25rem;">
                Grow Healthy. Live Green. ♡
            </p>
        </div>
        """
    )

# =============================================================================
# SCENARIO B: LOGGED IN -> MATCHING SCREEN 7 (SAVED HISTORY)
# =============================================================================
else:
    # Header bar with title and trash icon
    col_h1, col_h2 = st.columns([3, 1])
    with col_h1:
        md(
            """
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.5rem;">🕒</span>
                <h2 style="color: #163e23; font-size: 1.45rem; font-weight: 700; margin: 0;">
                    Saved History
                </h2>
            </div>
            """
        )
    with col_h2:
        if st.button("Clear All", help="Delete all saved records"):
            clear_user_history(user["id"])
            st.success("All records cleared.")
            st.rerun()

    records = get_user_history(user["id"])

    if not records:
        md(
            """
            <div class="m-card" style="text-align: center; padding: 2.2rem 1.2rem; margin-top: 1rem;">
                <span style="font-size: 3rem; display: block; margin-bottom: 8px;">🪴</span>
                <h4 style="margin: 0 0 6px 0; color: #163e23;">No Saved Detections Yet</h4>
                <p style="margin: 0; color: #6a8573; font-size: 0.88rem;">
                    Capture an Aloe vera leaf on the Disease Detection page to track its health history here.
                </p>
            </div>
            """
        )
        if st.button("📷 Detect Disease Now", type="primary", use_container_width=True):
            st.switch_page("pages/1_Analyze.py")
    else:
        md(
            f"""
            <div style="display: flex; gap: 8px; margin: 0.6rem 0 1rem 0;">
                <span style="background: #183d24; color: #ffffff; padding: 4px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">All ({len(records)})</span>
                <span style="background: #ffffff; color: #55755e; border: 1px solid #d5e8d4; padding: 4px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600;">Detections</span>
            </div>
            """
        )

        for record in records:
            rec_id = record["id"]
            timestamp = record.get("timestamp", "Recent")
            condition = record.get("condition") or "Low Confidence Detection"
            confidence = float(record.get("confidence", 0.0))
            sec_label = record.get("second_label")
            sec_conf = float(record.get("second_confidence", 0.0))
            thumbnail_blob = record.get("thumbnail")
            photo_saved = bool(record.get("consent_photo_saved"))

            with st.container():
                col_t1, col_t2, col_t3 = st.columns([1, 2.2, 0.6])

                with col_t1:
                    if thumbnail_blob and photo_saved:
                        try:
                            thumb_img = Image.open(io.BytesIO(thumbnail_blob))
                            st.image(thumb_img, width=80)
                        except Exception:
                            st.markdown("🍃")
                    else:
                        st.markdown(
                            """
                            <div style="background: #eaf4e9; border-radius: 12px; width: 75px; height: 75px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
                                🌿
                            </div>
                            """,
                            unsafe_allow_html=True
                        )

                with col_t2:
                    st.markdown(f"**{condition}**")
                    st.markdown(
                        f"""
                        <span style="background: #e8f5e9; color: #1b5e20; padding: 2px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700;">
                            Confidence: {confidence * 100:.1f}%
                        </span>
                        """,
                        unsafe_allow_html=True
                    )
                    st.caption(f"🗓️ {timestamp}")

                with col_t3:
                    if st.button("🗑️", key=f"del_{rec_id}", help="Delete record"):
                        delete_history_record(rec_id, user["id"])
                        st.rerun()

                st.markdown("<hr style='border: none; border-top: 1px solid #e2eee1; margin: 8px 0;'>", unsafe_allow_html=True)

        md(
            """
            <div class="m-card" style="text-align: center; margin-top: 1.5rem; background: #eaf4e9 !important; border: 1px dashed #a5d6a7 !important;">
                <span style="font-size: 1.8rem; display: block; margin-bottom: 4px;">🌱</span>
                <p style="margin: 0; color: #1b5e20; font-weight: 700; font-size: 0.92rem;">
                    Track your plant's health journey! ♡
                </p>
            </div>
            """
        )
