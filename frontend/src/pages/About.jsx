import React from "react";
import { useApp } from "../context/AppContext";
import { signOut as apiSignOut } from "../api/client";
import toast from "react-hot-toast";

export default function About() {
  const { user, setUser, lang, setLang, t } = useApp();

  const handleSignOut = async () => {
    await apiSignOut();
    setUser(null);
    toast.success(t("auth_btn_signout", "Signed out successfully."));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          <span>🌿</span>
          <span>{t("about_title", "About AloeMithra")}</span>
        </h1>
        <p>{t("about_subtitle", "Your Intelligent Companion for Aloe Vera Plant Health & Care")}</p>
      </div>

      {/* User profile card */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1.2rem" }}>
        <div
          style={{
            background: "var(--accent-mint)",
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            border: "2px solid var(--accent-border)",
            flexShrink: 0,
          }}
        >
          🪴
        </div>
        <div>
          <h3 style={{ fontSize: "1.15rem", color: "var(--primary-dark)" }}>
            {user?.username || "AloeMithra"}
          </h3>
          <p style={{ color: "var(--primary-mid)", fontWeight: 600, fontSize: "0.85rem" }}>
            {t("about_user_tag", "Healthy Plant Lover ♡")}
          </p>
        </div>
      </div>

      {/* Language Switcher */}
      <div className="card" style={{ marginBottom: "1.2rem" }}>
        <h4 style={{ marginBottom: 10, color: "var(--primary-dark)", fontSize: "0.95rem" }}>
          🌐 {t("lbl_select_language", "Choose Display Language")}
        </h4>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 320,
              padding: "9px 14px",
              borderRadius: 12,
              border: "1.5px solid var(--accent-border)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            <option value="en">English</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
      </div>

      {/* Main Mission & Purpose Card */}
      <div className="card" style={{ marginBottom: "1.2rem" }}>
        <h3 style={{ color: "var(--primary-dark)", fontSize: "1.1rem", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          {t("about_mission_title", "🌱 Our Purpose & Mission")}
        </h3>
        <p style={{ fontSize: "0.92rem", color: "var(--text-main)", lineHeight: 1.75 }}>
          {t(
            "about_mission_desc",
            "AloeMithra is an intelligent plant healthcare system designed specifically for Aloe Vera (Aloe barbadensis Miller). It helps farmers, herbal growers, and home plant lovers quickly identify foliar diseases, understand visual heatmaps, and adopt safe, research-backed organic and cultural care."
          )}
        </p>
      </div>

      {/* 3 Simple Steps for Users */}
      <div className="card" style={{ marginBottom: "1.2rem" }}>
        <h3 style={{ color: "var(--primary-dark)", fontSize: "1.1rem", marginBottom: 14 }}>
          {t("about_steps_title", "📖 How to Use AloeMithra in 3 Simple Steps")}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div style={{ background: "var(--accent-soft)", padding: "14px 16px", borderRadius: 14, border: "1px solid var(--accent-border)" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>📷</div>
            <strong style={{ display: "block", color: "var(--primary-dark)", fontSize: "0.95rem", marginBottom: 4 }}>
              {t("about_step1_title", "1. Take a Leaf Photo")}
            </strong>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {t("about_step1_desc", "Photograph a single affected leaf against a plain, clean dark surface with good natural lighting.")}
            </p>
          </div>

          <div style={{ background: "var(--accent-soft)", padding: "14px 16px", borderRadius: 14, border: "1px solid var(--accent-border)" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>⚡</div>
            <strong style={{ display: "block", color: "var(--primary-dark)", fontSize: "0.95rem", marginBottom: 4 }}>
              {t("about_step2_title", "2. Instant AI Diagnosis & Grad-CAM")}
            </strong>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {t("about_step2_desc", "Our vision model pinpoints the condition and generates a visual heatmap showing exact infected regions.")}
            </p>
          </div>

          <div style={{ background: "var(--accent-soft)", padding: "14px 16px", borderRadius: 14, border: "1px solid var(--accent-border)" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>🌿</div>
            <strong style={{ display: "block", color: "var(--primary-dark)", fontSize: "0.95rem", marginBottom: 4 }}>
              {t("about_step3_title", "3. Targeted Care & Treatment")}
            </strong>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {t("about_step3_desc", "Receive safe, tailored organic sanitation, soil, and management steps designed specifically for that diagnosis.")}
            </p>
          </div>
        </div>
      </div>

      {/* Plant Care Guidelines Card */}
      <div className="card" style={{ marginBottom: "1.2rem" }}>
        <h3 style={{ color: "var(--primary-dark)", fontSize: "1.1rem", marginBottom: 12 }}>
          {t("about_tips_title", "🌿 Essential Aloe Vera Care Guidelines")}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--accent-border)", background: "var(--bg-card)" }}>
            <strong style={{ color: "var(--primary-dark)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              💧 {t("about_tip1_label", "Smart Watering")}
            </strong>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {t("about_tip1_desc", "Aloe vera is a succulent. Water deeply only when the top 2 inches of soil are completely dry. Never let pots sit in standing water.")}
            </p>
          </div>

          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--accent-border)", background: "var(--bg-card)" }}>
            <strong style={{ color: "var(--primary-dark)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              ☀️ {t("about_tip2_label", "Sunlight & Shade")}
            </strong>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {t("about_tip2_desc", "Provide bright, indirect sunlight (6 hours daily). Harsh midday scorching sun causes sunburn (browning).")}
            </p>
          </div>

          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid var(--accent-border)", background: "var(--bg-card)" }}>
            <strong style={{ color: "var(--primary-dark)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              🪴 {t("about_tip3_label", "Well-Draining Soil")}
            </strong>
            <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              {t("about_tip3_desc", "Use sandy cactus/succulent potting mix with perlite or coarse sand to prevent root rot.")}
            </p>
          </div>
        </div>
      </div>

      {/* Developer & Technical Specifications (Collapsible / Tucked Away) */}
      <details
        className="card"
        style={{
          marginBottom: "1.5rem",
          background: "var(--accent-soft)",
          border: "1.5px dashed var(--accent-border)",
        }}
      >
        <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--primary-dark)", fontSize: "0.95rem" }}>
          {t("about_dev_toggle_title", "🛠️ Developer & Technical Specifications (For Engineers & Researchers)")}
        </summary>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 8, marginBottom: 12 }}>
          {t("about_dev_toggle_hint", "Click to view neural network architecture, model validation metrics, dataset specifications, and research constraints.")}
        </p>

        <ul style={{ paddingLeft: 20, fontSize: "0.86rem", color: "var(--text-main)", lineHeight: 1.8 }}>
          <li>
            <strong>{t("about_dev_arch", "Model Architecture: EfficientNetB0 (Transfer Learning) with custom dense classification head.")}</strong>
          </li>
          <li>
            <strong>{t("about_dev_accuracy", "Validation Performance: Reached approximately 83% validation accuracy across controlled test evaluations.")}</strong>
          </li>
          <li>
            <strong>{t("about_dev_dataset", "Training Dataset: Trained on photographic samples of individual leaves against plain dark non-reflective surfaces.")}</strong>
          </li>
          <li>
            <strong>{t("about_dev_constraints", "Environmental Constraints: The model has not been validated on complex open-field weed backgrounds or extreme direct glare.")}</strong>
          </li>
          <li>
            <strong>{t("about_dev_api", "Decoupled API: RESTful architecture with Flask endpoints (/api/analyze, /api/knowledge, /api/chat).")}</strong>
          </li>
        </ul>
      </details>

      {user && (
        <button className="btn btn-danger btn-full" onClick={handleSignOut} style={{ marginBottom: "1.5rem" }}>
          🚪 {t("auth_btn_signout", "Sign Out")}
        </button>
      )}

      <p className="slogan" style={{ textAlign: "center", color: "var(--primary-mid)", fontWeight: 600 }}>
        {t("banner_slogan", "Together for a Greener Tomorrow ♡")}
      </p>
    </div>
  );
}
