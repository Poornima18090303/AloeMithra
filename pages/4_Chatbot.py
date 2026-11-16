"""
AloeMithra Chatbot Page
(Matching Screen 5 of Mobile App Mockup)
Intelligent, research-safe conversational assistant for Aloe vera health.
"""

from pathlib import Path
import textwrap
import streamlit as st
from core.i18n import t, render_language_selector
from core.assistant import generate_bot_reply

st.set_page_config(
    page_title="AloeMithra Chatbot",
    page_icon="🤖",
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

# Top Header (Screen 5 Mockup)
col_nav, col_title = st.columns([1, 6])
with col_nav:
    if st.button("←", key="btn_back_home"):
        st.switch_page("app.py")
with col_title:
    md(
        """
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 4px;">
            <h3 style="margin: 0; color: #163e23; font-size: 1.35rem; font-weight: 700;">
                🤖 AloeMithra Chatbot
            </h3>
            <span style="font-size: 1.3rem;">🍃</span>
        </div>
        """
    )

st.markdown("<div style='height: 8px;'></div>", unsafe_allow_html=True)

# Initialize chat history
if "chat_messages" not in st.session_state:
    st.session_state["chat_messages"] = [
        {
            "role": "assistant",
            "content": "Hi! I'm **AloeMithra** 🌱\n\nHow can I help your Aloe vera plants thrive today?"
        }
    ]

# Render chat conversation
for msg in st.session_state["chat_messages"]:
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="🌱"):
            st.markdown(msg["content"])

# Quick Suggestion Chips (Screen 5 Mockup)
md(
    """
    <div style="margin: 0.6rem 0 0.4rem 0;">
        <span style="font-size: 0.78rem; font-weight: 700; color: #55755e; text-transform: uppercase;">
            Quick Topics:
        </span>
    </div>
    """
)

col_s1, col_s2, col_s3 = st.columns(3)
with col_s1:
    if st.button("🍂 Aloe Rust", use_container_width=True):
        st.session_state["chat_messages"].append({"role": "user", "content": "Tell me about Aloe Rust symptoms and management"})
        st.session_state["chat_messages"].append({"role": "assistant", "content": generate_bot_reply("rust")})
        st.rerun()

with col_s2:
    if st.button("☀️ Sunburn Care", use_container_width=True):
        st.session_state["chat_messages"].append({"role": "user", "content": "How do I fix sunburn on Aloe vera?"})
        st.session_state["chat_messages"].append({"role": "assistant", "content": generate_bot_reply("sunburn")})
        st.rerun()

with col_s3:
    if st.button("💧 Watering Tips", use_container_width=True):
        st.session_state["chat_messages"].append({"role": "user", "content": "How should I water my Aloe vera?"})
        st.session_state["chat_messages"].append({"role": "assistant", "content": generate_bot_reply("healthy")})
        st.rerun()

# User Chat Input
user_input = st.chat_input("Type your question about Aloe vera health...")
if user_input:
    st.session_state["chat_messages"].append({"role": "user", "content": user_input})
    reply = generate_bot_reply(user_input)
    st.session_state["chat_messages"].append({"role": "assistant", "content": reply})
    st.rerun()

# Slogan footer
md(
    """
    <div style="text-align: center; margin-top: 1.5rem;">
        <p class="heart-slogan" style="font-size: 1.15rem;">
            Because every Aloe Vera plant matters... ♡
        </p>
    </div>
    """
)
