"""
AloeMithra Voice Assistant Page
(Matching Screen 6 of Mobile App Mockup)
"""

from pathlib import Path
import textwrap
import streamlit as st
from core.i18n import t, render_language_selector
from core.assistant import generate_bot_reply

st.set_page_config(
    page_title="Voice Assistant - AloeMithra",
    page_icon="🎙️",
    layout="centered",
    initial_sidebar_state="collapsed"
)

def md(html_text: str):
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
if st.sidebar.button("🏠 Back to Home", use_container_width=True):
    st.switch_page("app.py")

# Top Header (Screen 6 Mockup)
col_nav, col_title = st.columns([1, 6])
with col_nav:
    if st.button("←", key="btn_back_home_voice"):
        st.switch_page("app.py")
with col_title:
    md(
        """
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 4px;">
            <h3 style="margin: 0; color: #163e23; font-size: 1.35rem; font-weight: 700;">
                Voice Assistant
            </h3>
            <span style="font-size: 1.4rem;">🎙️</span>
        </div>
        """
    )

st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

# Glowing Pulsing Microphone Centerpiece (Screen 6)
md(
    """
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 1.5rem 0 1.2rem 0;">
        <div style="width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 16px rgba(76, 175, 80, 0.18), 0 0 0 32px rgba(76, 175, 80, 0.08); margin-bottom: 1.2rem;">
            <span style="font-size: 3.5rem; color: #ffffff;">🎙️</span>
        </div>
        <h3 style="color: #163e23; font-size: 1.4rem; font-weight: 700; margin: 0 0 4px 0;">
            Tap to Speak
        </h3>
        <p style="color: #55755e; font-size: 0.92rem; margin: 0;">
            Ask anything about Aloe Vera plants...
        </p>
    </div>
    """
)

# Simulated Speech Input / Audio Prompt
spoken_query = st.text_input(
    "🎙️ Voice Input (Speak or type your plant question):",
    placeholder="e.g., 'What are the red patches on my aloe leaves?'",
    key="voice_input"
)

if spoken_query:
    response = generate_bot_reply(spoken_query)
    md(
        f"""
        <div class="m-card" style="margin-top: 1rem; border-left: 4px solid #2e7d32;">
            <p style="color: #2e7d32; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin: 0 0 4px 0;">
                Voice Assistant Guidance:
            </p>
            <div style="color: #163e23; font-size: 0.92rem; line-height: 1.5;">
                {response.replace(chr(10), '<br>')}
            </div>
        </div>
        """
    )

# Quick spoken questions chips
st.markdown("<div style='height: 10px;'></div>", unsafe_allow_html=True)
st.caption("Common voice queries you can tap:")

col_q1, col_q2 = st.columns(2)
with col_q1:
    if st.button("🗣️ 'How to treat rust?'", use_container_width=True):
        st.session_state["voice_input"] = "How to treat rust?"
        st.rerun()
    if st.button("🗣️ 'Why are leaves red?'", use_container_width=True):
        st.session_state["voice_input"] = "Why are leaves red?"
        st.rerun()

with col_q2:
    if st.button("🗣️ 'What is anthracnose?'", use_container_width=True):
        st.session_state["voice_input"] = "What is anthracnose?"
        st.rerun()
    if st.button("🗣️ 'Best watering schedule?'", use_container_width=True):
        st.session_state["voice_input"] = "Best watering schedule?"
        st.rerun()

# Cute Mascot Banner (Screen 6)
md(
    """
    <div style="background: #eaf4e9; border: 1.5px solid #c8e6c9; border-radius: 20px; padding: 1rem; display: flex; align-items: center; gap: 14px; margin-top: 1.5rem;">
        <span style="font-size: 2.5rem;">🪴</span>
        <div>
            <p style="margin: 0; font-weight: 700; color: #1b5e20; font-size: 0.95rem;">
                "I'm listening..." ♡
            </p>
            <p style="margin: 2px 0 0 0; color: #4a7054; font-size: 0.82rem;">
                Your voice companion for healthy Aloe vera cultivation.
            </p>
        </div>
    </div>
    """
)
