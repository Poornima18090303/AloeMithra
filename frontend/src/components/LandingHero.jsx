import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

// Mock demo data for the Watch Demo modal — shows what a real result looks like
const DEMO_RESULT = {
  label: "Aloe Rust",
  confidence: 94.2,
  description:
    "Aloe Rust is a fungal infection caused by Phakopsora pachyrhizi. It appears as small circular orange-brown pustules on leaf surfaces, often with a rust-coloured powdery coating.",
  symptoms: [
    "Orange-brown circular pustules on the adaxial (upper) leaf surface",
    "Powdery rust-coloured spore masses",
    "Yellow chlorotic halo surrounding affected spots",
    "Premature leaf yellowing and desiccation in severe cases",
  ],
  managementPreview: [
    "Remove and bag all heavily infected leaves immediately. Do not compost them.",
    "Sterilise cutting tools with 70% isopropyl alcohol between plants.",
    "Increase air circulation by spacing pots at least 30 cm apart.",
  ],
};

export default function LandingHero() {
  const { t, user } = useApp();
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  // "Get Started" goes to login if not signed in, or directly to analyze if signed in
  const handleGetStarted = (e) => {
    e.preventDefault();
    if (user) {
      navigate("/analyze");
    } else {
      navigate("/history");
    }
  };

  return (
    <>
      <div className="hero-landing-wrap">
        {/* Left Hero Content */}
        <div className="hero-left-col">
          <div className="hero-welcome-tag">
            <span className="tag-sparkle">✦</span>
            <span>{t("hero_welcome", "WELCOME TO")}</span>
            <span className="tag-sparkle">✦</span>
          </div>

          <h1 className="hero-main-title">
            AloeMithra
            <span className="title-sprout">🌿</span>
          </h1>

          <p className="hero-script-sub">
            {t("hero_script_sub", "Your Smart Companion for a Healthy Aloe Vera")}
          </p>

          <p className="hero-paragraph">
            {t(
              "hero_paragraph",
              "Detect diseases, get expert insights, and nurture your Aloe Vera plants with the power of AI!"
            )}
          </p>

          <div className="hero-action-btns">
            {/* Get Started → Sign In wall for guests, /analyze for logged-in users */}
            <button type="button" className="btn-pill-primary" onClick={handleGetStarted}>
              {user
                ? t("hero_btn_analyze", "Analyze a Leaf →")
                : t("hero_btn_get_started", "Get Started →")}
            </button>
            <button
              type="button"
              className="btn-pill-secondary"
              onClick={() => setShowDemoModal(true)}
            >
              <span style={{ fontSize: "0.9rem" }}>▶</span>
              <span>{t("hero_btn_watch_demo", "Watch Demo")}</span>
            </button>
          </div>
        </div>

        {/* Right Hero Visual */}
        <div className="hero-visual-col">
          <div className="hero-plant-container">
            <img
              src="https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=700&q=85"
              alt="Aloe Vera Plant"
              className="hero-main-plant-img"
            />

            {/* Holographic Detection HUD */}
            <div className="hud-scanner-ring">
              <div className="hud-inner-crosshair" />
              <div className="hud-scan-line" />
            </div>

            {/* Floating Detection Badge */}
            <div className="floating-badge-detected">
              <span className="badge-check-icon">✓</span>
              <div>
                <span className="badge-sub-label">{t("hero_floating_detected", "Disease Detected:")}</span>
                <strong className="badge-disease-title">Leaf Spot</strong>
              </div>
              <span style={{ fontSize: "1rem" }}>🍃</span>
            </div>

            {/* Floating Grad-CAM Card */}
            <div className="floating-gradcam-card">
              <div className="gradcam-card-header">{t("hero_gradcam_label", "Grad-CAM")}</div>
              <div className="gradcam-card-thumb">
                <img
                  src="https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=300&q=80"
                  alt="Leaf Spot"
                  className="gradcam-thumb-base"
                />
                <div className="gradcam-heatmap-overlay" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          WATCH DEMO MODAL
          Shows: Disease detection + description + symptoms (visible)
          Hides: Treatment tabs are blurred with a Sign In gate overlay
          ============================================================ */}
      {showDemoModal && (
        <div className="modal-backdrop" onClick={() => setShowDemoModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 580, width: "100%" }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "1.5px", color: "var(--primary-mid)", marginBottom: 2 }}>
                  🎬 DEMO PREVIEW
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
                  AI Detection Result — {DEMO_RESULT.label}
                </h3>
              </div>
              <button
                className="icon-btn-circle"
                style={{ width: 32, height: 32 }}
                onClick={() => setShowDemoModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Confidence result bar */}
            <div
              style={{
                background: "var(--accent-soft)",
                border: "1.5px solid var(--accent-border)",
                borderRadius: 12,
                padding: "0.9rem 1rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  flexShrink: 0,
                }}
              >
                🍂
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--primary-dark)" }}>
                    {DEMO_RESULT.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary-mid)" }}>
                    {DEMO_RESULT.confidence}% confident
                  </span>
                </div>
                <div style={{ background: "var(--accent-border)", borderRadius: 999, height: 7, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${DEMO_RESULT.confidence}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #22c55e, #4ade80)",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Description & Symptoms — fully visible in demo */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--accent-border)",
                borderRadius: 12,
                padding: "0.9rem 1rem",
                marginBottom: "1rem",
              }}
            >
              <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--primary-dark)", margin: "0 0 6px 0" }}>
                📖 What is {DEMO_RESULT.label}?
              </h4>
              <p style={{ fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.6, margin: "0 0 10px 0" }}>
                {DEMO_RESULT.description}
              </p>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--primary-mid)", marginBottom: 4 }}>
                🔎 Key Symptoms Observed:
              </div>
              <ul style={{ paddingLeft: 16, fontSize: "0.81rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.75 }}>
                {DEMO_RESULT.symptoms.map((s, i) => (
                  <li key={i}>🍃 {s}</li>
                ))}
              </ul>
            </div>

            {/* Treatment section — LOCKED for guests */}
            <div style={{ position: "relative", marginBottom: "1.2rem" }}>
              {/* Blurred treatment preview underneath */}
              <div
                aria-hidden="true"
                style={{
                  filter: "blur(5px)",
                  pointerEvents: "none",
                  userSelect: "none",
                  background: "var(--bg-card)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: 12,
                  padding: "0.9rem 1rem",
                }}
              >
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--primary-dark)", margin: "0 0 10px 0" }}>
                  🛠️ Targeted Treatment Steps:
                </h4>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {["🧹 Sanitation", "🌱 Cultural", "🦠 Biological", "🧪 Chemical", "⚠️ Precautions"].map((tab, i) => (
                    <span
                      key={tab}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: i === 0 ? "var(--primary-mid)" : "var(--accent-soft)",
                        color: i === 0 ? "#fff" : "var(--text-muted)",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                      }}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
                {DEMO_RESULT.managementPreview.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--accent-soft)",
                      border: "1px solid var(--accent-border)",
                      borderLeft: "4px solid var(--primary-mid)",
                      borderRadius: 8,
                      padding: "9px 12px",
                      marginBottom: 8,
                      fontSize: "0.83rem",
                      color: "var(--text-main)",
                    }}
                  >
                    • {item}
                  </div>
                ))}
              </div>

              {/* Lock overlay — sits on top of the blurred content */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    background: "var(--primary-dark)",
                    color: "#f0fdf4",
                    borderRadius: 16,
                    padding: "16px 24px",
                    textAlign: "center",
                    boxShadow: "0 10px 30px rgba(22, 62, 35, 0.4)",
                    maxWidth: 320,
                  }}
                >
                  <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>🔒</div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 4 }}>
                    Full Treatment Plan Requires Sign In
                  </div>
                  <div style={{ fontSize: "0.79rem", opacity: 0.75, marginBottom: 14, lineHeight: 1.5 }}>
                    5 research-backed care tabs — sanitation, cultural, biological,
                    chemical & safety — are waiting for you.
                  </div>
                  <Link
                    to="/history"
                    className="btn-pill-primary"
                    style={{
                      fontSize: "0.85rem",
                      padding: "0.5rem 1.4rem",
                      display: "inline-block",
                      background: "#22c55e",
                      color: "#051b0d",
                    }}
                    onClick={() => setShowDemoModal(false)}
                  >
                    👤 Sign In / Create Account →
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              🌿 Free account · No credit card required · Instant access
            </p>
          </div>
        </div>
      )}
    </>
  );
}
