"""
AloeMithra - Mobile Health Assistant for Aloe Vera
Home Dashboard (Screen 3 of Mobile App Mockup)
"""

from pathlib import Path
import base64
import textwrap
import streamlit as st

from core.i18n import t, render_language_selector
from core.auth import get_current_user

st.set_page_config(
    page_title="AloeMithra - Plant Health",
    page_icon="🌿",
    layout="centered",
    initial_sidebar_state="collapsed"
)

def md(html_text: str):
    """Safely render HTML without markdown codeblock indentation issues."""
    st.markdown(textwrap.dedent(html_text).strip(), unsafe_allow_html=True)

# Helper to encode images
def get_base64_file(filepath: Path) -> str:
    if filepath.exists():
        with open(filepath, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    return ""

assets_dir = Path(__file__).parent / "assets"
hero_img_path = assets_dir / "dashboard_hero.jpg"
hero_b64 = get_base64_file(hero_img_path)

# Load CSS
css_file = assets_dir / "style.css"
if css_file.exists():
    with open(css_file, "r", encoding="utf-8") as f:
        md(f"<style>{f.read()}</style>")

# Sidebar
st.sidebar.markdown("## 🌿 **AloeMithra**")
st.sidebar.caption("Detect • Understand • Nurture")
st.sidebar.divider()
render_language_selector()
st.sidebar.divider()
st.sidebar.info("💡 **Tip:** Photograph one leaf on a plain dark surface with uniform lighting.")

curr_user = get_current_user()
user_name = curr_user["username"] if curr_user else "AloeMithra"

# TOP PHONE HEADER BAR (SCREEN 3)
md(
    f"""
    <div class="phone-top-bar">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 1.4rem; color: #163e23; cursor: pointer;">☰</div>
            <div>
                <h2 class="greeting-title">Hello, {user_name}! 👋</h2>
                <p class="greeting-sub">Healthy Plants, Happy Life!</p>
            </div>
        </div>
        <div style="background: #ffffff; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; border: 1px solid #d5e8d4; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            🔔
        </div>
    </div>
    """
)

# HERO DISEASE DETECTION BANNER CARD (SCREEN 3)
if hero_b64:
    hero_img_tag = f"""<img src="data:image/jpeg;base64,{hero_b64}" style="width: 100%; height: 175px; object-fit: cover; display: block;" alt="Aloe Vera Plant" />"""
else:
    hero_img_tag = """<div style="height: 175px; background: #2e7d32;"></div>"""

md(
    f"""
    <div class="hero-card">
        {hero_img_tag}
        <div class="hero-overlay">
            <div>
                <h3 style="margin: 0 0 2px 0; font-size: 1.18rem; font-weight: 800; color: #ffffff;">
                    Aloe Vera Disease Detection
                </h3>
                <p style="margin: 0; font-size: 0.85rem; color: #d5eed4; font-weight: 500;">
                    Scan • Analyse • Protect
                </p>
            </div>
            <div style="background: #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: #183d24; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                ➔
            </div>
        </div>
    </div>
    """
)

# Main Scan Button Pill (Screen 3)
md("""<div class="main-scan-btn">""")
if st.button("📷 Start Leaf Scan Now →", key="btn_main_scan", use_container_width=True):
    st.switch_page("pages/1_Analyze.py")
md("""</div>""")

st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

# 4-TILE QUICK ACTION GRID (SCREEN 3)
md("""<div class="action-tiles-grid">""")
col1, col2 = st.columns(2)

with col1:
    if st.button("📷\nDetect Disease\nScan & Protect", key="tile_detect", use_container_width=True):
        st.switch_page("pages/1_Analyze.py")

    st.markdown("<div style='height: 4px;'></div>", unsafe_allow_html=True)

    if st.button("🎙️\nVoice Assistant\nCare Advice", key="tile_voice", use_container_width=True):
        st.switch_page("pages/5_Voice_Assistant.py")

with col2:
    if st.button("💬\nChatbot\nAsk Anything", key="tile_chat", use_container_width=True):
        st.switch_page("pages/4_Chatbot.py")

    st.markdown("<div style='height: 4px;'></div>", unsafe_allow_html=True)

    if st.button("🕒\nSaved History\nPast Records", key="tile_history", use_container_width=True):
        st.switch_page("pages/2_History.py")
md("""</div>""")

# SLOGAN QUOTE BANNER (SCREEN 3)
md(
    """
    <div class="quote-banner">
        <p class="quote-text">
            "Healthy Aloe, Greener Tomorrow 🌱"
        </p>
    </div>
    """
)

# MAIN SLOGAN (SCREEN 1)
md(
    """
    <div style="text-align: center; margin: 0.5rem 0 1rem 0;">
        <p class="heart-slogan" style="font-size: 1.3rem; margin: 0;">
            Because every Aloe Vera plant matters... ♡
        </p>
        <p style="font-size: 0.78rem; color: #6a8573; margin: 4px 0 0 0;">
            Grow Healthy. Live Green. ♡
        </p>
    </div>
    """
)

# BOTTOM NAVIGATION BAR (SCREEN 3)
col_nav1, col_nav2, col_nav3 = st.columns(3)
with col_nav1:
    if st.button("🏠 Home", key="bnav_home", use_container_width=True):
        st.rerun()
with col_nav2:
    if st.button("🕒 History", key="bnav_hist", use_container_width=True):
        st.switch_page("pages/2_History.py")
with col_nav3:
    if st.button("👤 Profile", key="bnav_prof", use_container_width=True):
        st.switch_page("pages/3_About.py")

# Mandatory Safety Disclaimer footer
md(
    f"""
    <div style="background: #fbfdfb; border-radius: 12px; border: 1px solid #e1efe0; padding: 10px 14px; margin-top: 1rem; text-align: center;">
        <p style="margin: 0; font-size: 0.76rem; color: #6a8573; line-height: 1.4;">
            ⚠️ <em>{t('disclaimer_text')}</em>
        </p>
    </div>
    """
)
