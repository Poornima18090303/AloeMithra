"""
About & Settings Page for AloeMithra.
(Matching Screen 8 of Mobile App Mockup)
"""

from pathlib import Path
import textwrap
import streamlit as st
from core.i18n import t, render_language_selector, SUPPORTED_LANGUAGES, get_current_language, set_current_language
from core.auth import get_current_user, is_authenticated, sign_out

st.set_page_config(
    page_title="Settings - AloeMithra",
    page_icon="⚙️",
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
user_display = user["username"] if user else "AloeMithra"

# Header (Matching Screen 8 Mockup)
md(
    """
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.2rem;">
        <span style="font-size: 1.6rem;">⚙️</span>
        <h2 style="font-size: 1.45rem; font-weight: 700; color: #163e23; margin: 0;">
            Settings & Project Info
        </h2>
    </div>
    """
)

# User Profile Card (Screen 8)
md(
    f"""
    <div class="m-card" style="display: flex; align-items: center; gap: 14px; margin-bottom: 1.2rem;">
        <div style="background: #eaf4e9; width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; border: 1.5px solid #a5d6a7;">
            🪴
        </div>
        <div>
            <h3 style="margin: 0; color: #163e23; font-size: 1.15rem;">{user_display}</h3>
            <p style="margin: 2px 0 0 0; color: #43a047; font-weight: 600; font-size: 0.85rem;">
                Healthy Plant Lover ♡
            </p>
        </div>
    </div>
    """
)

# Language Selector
st.markdown("#### 🌐 Language")
current_lang = get_current_language()
lang_options = list(SUPPORTED_LANGUAGES.keys())
lang_idx = lang_options.index(current_lang) if current_lang in lang_options else 0

selected_lang = st.selectbox(
    "Choose your display language:",
    options=lang_options,
    index=lang_idx,
    format_func=lambda code: SUPPORTED_LANGUAGES.get(code, code),
    key="settings_lang_select"
)
if selected_lang != current_lang:
    set_current_language(selected_lang)
    st.rerun()

st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)

# Engineering Project Information
with st.expander("ℹ️ About AloeMithra Project", expanded=True):
    st.markdown(
        """
        **AloeMithra** is a final-year AI/ML engineering project designed to empower 
        farmers and plant lovers with fast, accessible leaf health diagnostics 
        for Aloe vera (*Aloe barbadensis Miller*).
        
        - **Target Classes**: Aloe Rust, Anthracnose, Healthy, Leaf Spot, Sunburn.
        - **Engine**: Keras 3 / TensorFlow 2.17 Mobile Deep Learning Architecture.
        - **Decoupled Design**: Prediction core is completely isolated from the UI for future mobile app and API deployment.
        """
    )

# Model Training Boundary & Limitations
with st.expander("⚠️ Crucial Model Limitations & Transparency", expanded=True):
    st.markdown(
        """
        - **Dataset Background**: The neural network was trained exclusively on photos of **individual leaves against plain dark backgrounds**.
        - **Validation Accuracy**: Reached approximately **83% accuracy** on its validation set.
        - **Field Testing**: The model **has not been tested on real field photos with natural backgrounds**, weeds, soil, or complex outdoor lighting.
        - **User Guidance**: Always photograph a single leaf on a clean, dark surface in good lighting for dependable results.
        """
    )

# Research Safety Boundaries
with st.expander("🛡️ Research & Treatment Safety Rules", expanded=False):
    st.markdown(
        """
        - **No Invented Treatments**: All management suggestions are loaded strictly from vetted JSON profiles.
        - **Sunburn Protection**: Sunburn is environmental UV damage; chemical fungicides are strictly prohibited.
        - **Healthy Maintenance**: Healthy plants receive only routine preventive care.
        - **Low-Confidence Safeguard**: Inconclusive predictions withhold disease names to avoid inappropriate chemical application.
        """
    )

if is_authenticated():
    if st.button("🚪 Logout of Account", use_container_width=True):
        sign_out()
        st.rerun()

# Bottom Slogan (Screen 8)
md(
    """
    <div style="text-align: center; margin-top: 2rem;">
        <p class="heart-slogan" style="font-size: 1.35rem; color: #1e4d2b;">
            Together for a Greener World ♡
        </p>
    </div>
    """
)
