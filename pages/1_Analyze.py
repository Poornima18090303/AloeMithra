"""
Analyze Page for AloeMithra - Disease Detection
(Matching Screen 4 of Mobile App Mockup)
"""

from pathlib import Path
import os
import io
import textwrap
import streamlit as st
from PIL import Image

from core.i18n import t, render_language_selector, get_current_language
from core.knowledge import get_condition_data
from core.predictor import predict, MODEL_LOAD_STATUS, MODEL_LOAD_ERROR
from core.auth import get_current_user, is_authenticated
from core.db import add_history_record

st.set_page_config(
    page_title="Disease Detection - AloeMithra",
    page_icon="🌿",
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
st.sidebar.divider()
render_language_selector()
st.sidebar.divider()

# Developer Mode
dev_pwd_env = os.getenv("ALOEMITHRA_DEV_PASSWORD", "")
dev_mode_active = False
if dev_pwd_env:
    with st.sidebar.expander("🛠️ Developer Mode", expanded=False):
        entered_pwd = st.text_input("Dev Password", type="password", key="dev_pwd_input")
        if entered_pwd == dev_pwd_env:
            dev_mode_active = True
            st.success("Developer mode active")
            st.caption(f"Model Status: {MODEL_LOAD_STATUS}")
            if MODEL_LOAD_ERROR:
                st.caption(f"Load Error: {MODEL_LOAD_ERROR}")

# Header (Matching Screen 4 Mockup)
md(
    """
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
            <h2 style="font-size: 1.45rem; font-weight: 700; color: #163e23; margin: 0;">
                🌿 Disease Detection
            </h2>
            <p style="font-size: 0.85rem; color: #55755e; margin: 2px 0 0 0;">
                Scan • Analyse • Protect
            </p>
        </div>
        <span style="font-size: 1.5rem;">🍃</span>
    </div>
    """
)

# Photo Guidance Box
with st.expander(t("tips_header"), expanded=False):
    st.markdown(
        f"""
        - 🍃 **{t('tips_item_1')}**
        - ⬛ **{t('tips_item_2')}**
        - 💡 **{t('tips_item_3')}**
        - 🎯 **{t('tips_item_4')}**
        """
    )

# Upload or Capture Card (Screen 4)
md(
    """
    <div class="m-card" style="text-align: center; padding: 1.2rem; margin-bottom: 1rem;">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 6px;">🖼️</span>
        <h4 style="margin: 0 0 4px 0; color: #163e23; font-size: 1.05rem;">Upload or Capture an Aloe Vera Leaf</h4>
        <p style="margin: 0; color: #6a8573; font-size: 0.85rem;">Position a single leaf on a dark background</p>
    </div>
    """
)

input_choice = st.radio(
    t("input_method_title"),
    [t("input_method_camera"), t("input_method_upload")],
    horizontal=True,
    label_visibility="collapsed"
)

uploaded_file = None
if input_choice == t("input_method_camera"):
    uploaded_file = st.camera_input(t("camera_prompt"))
else:
    uploaded_file = st.file_uploader(
        t("upload_prompt"),
        type=["jpg", "jpeg", "png"]
    )

if uploaded_file is not None:
    try:
        pil_image = Image.open(uploaded_file)
        st.image(pil_image, caption="Uploaded Leaf Preview", use_container_width=True)
    except Exception as e:
        st.error(f"Error opening image: {e}")
        st.stop()

    # Privacy Consent Checkbox
    consent_photo = st.checkbox(
        f"🛡️ {t('consent_checkbox_label')}",
        value=False,
        help=t("consent_explanation")
    )
    st.caption(f"ℹ️ {t('consent_explanation')}")

    if st.button("⚡ Run Leaf Analysis Now", type="primary", use_container_width=True):
        with st.spinner(t("msg_analyzing")):
            prediction = predict(pil_image)

        status = prediction.get("status", "retake_low_confidence")
        confidence = float(prediction.get("confidence", 0.0))
        label = prediction.get("label")
        second_label = prediction.get("second_label")
        second_conf = float(prediction.get("second_confidence", 0.0))
        probabilities = prediction.get("probabilities", {})

        # Auto-save to user history if logged in
        curr_user = get_current_user()
        if curr_user is not None:
            thumb_bytes = None
            if consent_photo:
                try:
                    thumb = pil_image.copy()
                    thumb.thumbnail((200, 200))
                    buffer = io.BytesIO()
                    thumb.save(buffer, format="JPEG", quality=85)
                    thumb_bytes = buffer.getvalue()
                except Exception:
                    thumb_bytes = None

            add_history_record(
                user_id=curr_user["id"],
                condition=label,
                confidence=confidence,
                second_label=second_label,
                second_confidence=second_conf,
                status=status,
                language=get_current_language(),
                thumbnail_bytes=thumb_bytes,
                consent_photo_saved=consent_photo
            )
            st.success(f"💾 {t('history_saved_alert')}")
        else:
            st.info(f"💡 {t('history_guest_notice')}")

        st.markdown("---")

        # Developer Mode Inspector
        if dev_mode_active:
            with st.expander("🛠️ Raw Model Output & Probabilities (Developer Mode)", expanded=True):
                st.json({
                    "status": status,
                    "confidence": confidence,
                    "label": label,
                    "second_label": second_label,
                    "second_confidence": second_conf,
                    "probabilities": probabilities,
                    "diagnostic_note": prediction.get("diagnostic_note")
                })

        # =========================================================================
        # STATUS HANDLING
        # =========================================================================

        # CASE 1: RETAKE - NO LEAF
        if status == "retake_no_leaf":
            md(
                f"""
                <div class="m-card" style="border-left: 5px solid #d32f2f;">
                    <div class="status-pill-retake" style="margin-bottom: 8px;">
                        ⚠️ Retake Needed
                    </div>
                    <h4 style="color: #c62828; margin: 0 0 6px 0;">{t('status_retake_no_leaf')}</h4>
                    <p style="margin: 0; color: #5f2120; font-size: 0.88rem;">
                        {t('tips_item_1')}<br>
                        {t('tips_item_2')}<br>
                        {t('tips_item_3')}<br>
                        {t('tips_item_4')}
                    </p>
                </div>
                """
            )

        # CASE 2: RETAKE - LOW CONFIDENCE
        # Strict Rule: Do NOT show any disease name or treatment!
        elif status == "retake_low_confidence":
            md(
                f"""
                <div class="m-card" style="border-left: 5px solid #f57c00;">
                    <div class="status-pill-warning" style="margin-bottom: 8px;">
                        ⚠️ Low Confidence Inconclusive
                    </div>
                    <p style="margin: 0; color: #5f2120; font-size: 0.95rem; font-weight: 600;">
                        {t('status_retake_low_conf')}
                    </p>
                </div>
                """
            )
            st.info(f"💡 {t('confidence_honesty_note')}")

        # CASE 3 & 4: CONFIDENT or POSSIBLE (Screen 4 Layout)
        elif status in ["confident", "possible"]:
            kb_data = get_condition_data(label) if label else None

            # Status Badge Pill (e.g. "✓ Disease Detected! (Leaf Spot)")
            if status == "possible":
                badge_html = f'<div class="status-pill-warning">⚠️ Possible Condition Detected: ({label})</div>'
            else:
                badge_html = f'<div class="status-pill-detected">✓ Condition Detected! ({label})</div>'

            md(
                f"""
                <div class="m-card">
                    {badge_html}
                    <h3 style="margin: 10px 0 4px 0; color: #163e23; font-size: 1.3rem;">
                        {label}
                    </h3>
                    <p style="margin: 0 0 8px 0; font-size: 0.82rem; color: #6a8573;">
                        Category: <strong>{kb_data.get('type', 'General').capitalize() if kb_data else 'General'}</strong> • Status: <strong>{kb_data.get('status', 'DRAFT') if kb_data else 'DRAFT'}</strong>
                    </p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 700; color: #1e4d2b; margin-top: 8px;">
                        <span>Confidence</span>
                        <span>{confidence * 100:.1f}%</span>
                    </div>
                </div>
                """
            )

            st.progress(min(max(confidence, 0.0), 1.0))

            if status == "possible" and second_label:
                md(
                    f"""
                    <div style="background: #fff8e1; border: 1px solid #ffe082; border-radius: 12px; padding: 10px 14px; margin-bottom: 12px;">
                        <p style="margin: 0; color: #7f4f04; font-size: 0.88rem;">
                            ⚠️ <strong>Caution:</strong> Moderate confidence detection. Secondary Candidate: <strong>{second_label} ({second_conf * 100:.1f}%)</strong>. Please verify symptoms before taking corrective action.
                        </p>
                    </div>
                    """
                )

            # Details & Knowledge Base Rendering
            if kb_data:
                md(
                    f"""
                    <div class="m-card">
                        <h4 style="margin: 0 0 6px 0; color: #163e23;">📖 {t('lbl_description')}</h4>
                        <p style="margin: 0 0 10px 0; color: #3a5c43; font-size: 0.92rem; line-height: 1.5;">{kb_data.get('description', '')}</p>
                        <h4 style="margin: 0 0 6px 0; color: #163e23;">🔎 {t('lbl_symptoms')}</h4>
                    </div>
                    """
                )
                for sym in kb_data.get("symptoms", []):
                    st.markdown(f"- 🍃 {sym}")

                st.markdown(f"#### 🛠️ {t('lbl_management')}")
                mgmt = kb_data.get("management", {})

                tab_sani, tab_cult, tab_bio, tab_chem, tab_prec = st.tabs([
                    f"🧹 {t('lbl_sanitation')}",
                    f"🌱 {t('lbl_cultural')}",
                    f"🦠 {t('lbl_biological')}",
                    f"🧪 {t('lbl_chemical')}",
                    f"⚠️ {t('lbl_precautions')}"
                ])

                def render_steps(steps_list):
                    if not steps_list:
                        st.info("No steps recorded.")
                        return
                    for item in steps_list:
                        step_text = item.get("step", "")
                        ev_level = item.get("evidence_level", "none")
                        sources = item.get("sources", [])
                        
                        md(
                            f"""
                            <div style="background: #ffffff; border-left: 3px solid #2e7d32; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                                <p style="margin: 0; color: #163e23; font-weight: 500; font-size: 0.92rem;">• {step_text}</p>
                                <span style="font-size: 0.72rem; color: #2e7d32; font-weight: 600; text-transform: uppercase;">
                                    Evidence Level: <em>{ev_level}</em>
                                </span>
                            </div>
                            """
                        )
                        if sources:
                            with st.expander("📚 Sources / References", expanded=False):
                                for s in sources:
                                    st.markdown(f"- {s}")

                with tab_sani:
                    render_steps(mgmt.get("sanitation", []))

                with tab_cult:
                    render_steps(mgmt.get("cultural", []))

                with tab_bio:
                    render_steps(mgmt.get("biological", []))

                with tab_chem:
                    render_steps(mgmt.get("chemical", []))

                with tab_prec:
                    render_steps(mgmt.get("precautions", []))

            # Bottom Actions
            col_act1, col_act2 = st.columns(2)
            with col_act1:
                if st.button("📷 Analyze Another Leaf", use_container_width=True):
                    st.rerun()
            with col_act2:
                if is_authenticated():
                    if st.button("📜 View In History", use_container_width=True):
                        st.switch_page("pages/2_History.py")

            # Mandatory Safety Disclaimer
            md(
                f"""
                <div style="background: #fffde7; border-radius: 12px; border: 1px solid #fff59d; padding: 12px; margin-top: 1.2rem; text-align: center;">
                    <p style="margin: 0; font-size: 0.8rem; color: #7f6000; line-height: 1.45;">
                        ⚠️ <em>{t('disclaimer_text')}</em>
                    </p>
                </div>
                """
            )
else:
    st.info(f"👆 {t('msg_please_provide_image')}")
