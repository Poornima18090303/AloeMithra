import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { analyzeLeaf, getHistory, getCondition } from "../api/client";
import ManagementTabs from "../components/ManagementTabs";
import {
  LogoIcon,
  RobotMascotGraphic,
  GlobeSproutGraphic,
  VoiceWaveGraphic,
  AloePotGraphic,
} from "../components/Illustrations";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, lang, setLang, theme, toggleTheme, t } = useApp();

  const [activeTab, setActiveTab]         = useState("dashboard");
  const [searchQuery, setSearchQuery]     = useState("");

  // Analysis state — starts as NULL until user uploads an image
  const [selectedFile, setSelectedFile]   = useState(null);
  const [previewUrl, setPreviewUrl]       = useState(null);
  const [analyzing, setAnalyzing]         = useState(false);
  const [result, setResult]               = useState(null);

  // Targeted treatment state — loaded ONLY after detection for THAT specific disease
  const [conditionKB, setConditionKB]     = useState(null);
  const [loadingKB, setLoadingKB]         = useState(false);

  // Recent history state
  const [historyItems, setHistoryItems]   = useState([
    {
      id: 1,
      condition: "Aloe Vera Rust",
      confidence: 0.968,
      date: "Oct 27, 2026",
      thumb: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 2,
      condition: "Healthy Plant",
      confidence: 0.987,
      date: "Oct 25, 2026",
      thumb: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: 3,
      condition: "Aloe Vera Leaf Spot",
      confidence: 0.941,
      date: "Oct 22, 2026",
      thumb: "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=400&q=80",
    },
  ]);

  const fileInputRef = useRef(null);
  const treatmentSectionRef = useRef(null);

  // Load real history if user is logged in
  useEffect(() => {
    if (user) {
      getHistory()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            const formatted = res.data.slice(0, 3).map((r) => ({
              id: r.id,
              condition: r.condition || "Aloe Vera Leaf",
              confidence: r.confidence || 0.92,
              date: r.timestamp?.split(" ")[0] || "Recent",
              thumb: r.thumbnail
                ? `data:image/jpeg;base64,${r.thumbnail}`
                : "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=400&q=80",
            }));
            setHistoryItems(formatted);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Handle image upload & automatic disease detection
  const handleFileChange = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setResult(null);
    setConditionKB(null);

    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("consent_photo", "true");
      const { data } = await analyzeLeaf(fd);
      setResult(data);

      // ONLY fetch and reveal treatment suggestions for the detected disease
      if (data.label && (data.status === "confident" || data.status === "possible")) {
        setLoadingKB(true);
        getCondition(data.label)
          .then((res) => {
            setConditionKB(res.data);
            setTimeout(() => {
              treatmentSectionRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 300);
          })
          .catch((err) => {
            console.warn("Could not fetch condition KB:", err);
          })
          .finally(() => setLoadingKB(false));
      }

      toast.success(t("status_confident_title", "Disease detection complete!"));
    } catch (err) {
      toast.error(t("msg_analyzing", "Analysis failed. Please try again."));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResetAnalysis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setConditionKB(null);
  };

  const userName = user?.username || "AloeMithra";

  return (
    <div className="dashboard-wrapper">
      {/* ============================================================
          LEFT SIDEBAR
         ============================================================ */}
      <aside className="dash-sidebar">
        <div>
          <Link to="/" className="sidebar-logo">
            <LogoIcon size={32} />
            <div>
              <div className="brand-name" style={{ fontSize: "1.25rem" }}>
                AloeMithra
              </div>
            </div>
          </Link>

          <nav className="sidebar-menu">
            <button
              className={"sidebar-item" + (activeTab === "dashboard" ? " active" : "")}
              onClick={() => setActiveTab("dashboard")}
            >
              <span style={{ fontSize: "1.15rem" }}>🏠</span>
              <span>{t("dash_sidebar_dashboard", "Dashboard")}</span>
            </button>

            <Link
              to="/analyze"
              className={"sidebar-item" + (activeTab === "detect" ? " active" : "")}
            >
              <span style={{ fontSize: "1.15rem" }}>🌿</span>
              <span>{t("dash_sidebar_detect", "Detect Disease")}</span>
            </Link>

            <Link
              to="/chatbot"
              className={"sidebar-item" + (activeTab === "chatbot" ? " active" : "")}
            >
              <span style={{ fontSize: "1.15rem" }}>💬</span>
              <span>{t("dash_sidebar_chat", "Chatbot")}</span>
            </Link>

            <Link
              to="/voice"
              className={"sidebar-item" + (activeTab === "voice" ? " active" : "")}
            >
              <span style={{ fontSize: "1.15rem" }}>🎙️</span>
              <span>{t("dash_sidebar_voice", "Voice Assistant")}</span>
            </Link>

            <Link
              to="/history"
              className={"sidebar-item" + (activeTab === "history" ? " active" : "")}
            >
              <span style={{ fontSize: "1.15rem" }}>🕒</span>
              <span>{t("dash_sidebar_history", "History")}</span>
            </Link>

            <Link
              to="/about"
              className={"sidebar-item" + (activeTab === "settings" ? " active" : "")}
            >
              <span style={{ fontSize: "1.15rem" }}>⚙️</span>
              <span>{t("dash_sidebar_settings", "Settings")}</span>
            </Link>
          </nav>
        </div>

        <div className="sidebar-footer-card">
          <AloePotGraphic width={90} height={75} />
          <p>{t("dash_sidebar_quote", "Healthy Plants, Happier World ♡")}</p>
        </div>
      </aside>

      {/* ============================================================
          MAIN CONTENT AREA
         ============================================================ */}
      <main className="dash-main">
        {/* Top Header Bar */}
        <div className="dash-header-bar">
          <div className="search-box">
            <span style={{ color: "#8fa895", fontSize: "0.95rem" }}>🔍</span>
            <input
              type="text"
              placeholder={t("dash_search_placeholder", "Search here...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                toast(theme === "light" ? t("msg_theme_dark", "Dark Mode active 🌙") : t("msg_theme_light", "Light Mode active ☀️"));
              }}
              className="icon-btn-circle"
              title={theme === "dark" ? t("theme_toggle_day", "Light Mode") : t("theme_toggle_dark", "Dark Mode")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{
                border: "1.5px solid var(--accent-border)",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: "0.82rem",
                color: "var(--text-main)",
                background: "var(--bg-card)",
                cursor: "pointer",
                fontWeight: 600,
                outline: "none",
              }}
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>

            <button
              className="icon-btn-circle"
              onClick={() => toast("All plant diagnostic systems operational! 🌿")}
              title="Notifications"
            >
              🔔
            </button>

            <Link
              to="/history"
              className="user-avatar-badge"
              title={`Logged in as ${userName}`}
              style={{ textDecoration: "none" }}
            >
              {userName.charAt(0).toUpperCase()}
            </Link>
          </div>
        </div>

        {/* Welcome Greeting Banner */}
        <div className="welcome-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: "2.4rem" }}>🪴</span>
            <div>
              <h2>{t("dash_greeting", "Hello")}, {userName}! 👋</h2>
              <p>
                {t(
                  "dash_greeting_sub",
                  "Let's keep your Aloe Vera plants healthy and thriving!"
                )}
              </p>
            </div>
          </div>
          <div style={{ opacity: 0.85, fontSize: "1.8rem" }}>🌿</div>
        </div>

        {/* ============================================================
            MIDDLE 3-COLUMN ANALYSIS GRID + RIGHT WIDGETS
           ============================================================ */}
        <div className="dash-grid-top">
          {/* Card 1: Upload Plant Image */}
          <div className="m-card-clean">
            <div className="m-card-title">
              <span style={{ color: "#2d6a4f" }}>📷</span>
              <span>{t("dash_upload_title", "Upload Plant Image")}</span>
            </div>
            <p className="m-card-desc">
              {t("dash_upload_desc", "Upload a clear image of your Aloe Vera plant to check for diseases.")}
            </p>

            <div
              className="dash-upload-box"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e.dataTransfer.files[0]);
              }}
            >
              {previewUrl ? (
                <div style={{ position: "relative", width: "100%", height: "100%", maxHeight: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={previewUrl}
                    alt="Uploaded Leaf Preview"
                    style={{ maxHeight: 105, maxWidth: "100%", borderRadius: 8, objectFit: "contain" }}
                  />
                </div>
              ) : (
                <>
                  <span style={{ fontSize: "2.2rem", color: "#40916c", marginBottom: 6 }}>
                    ☁️
                  </span>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 8px 0" }}>
                    {t("dash_drag_drop", "Drag & drop an image here or")}
                  </p>
                  <button
                    type="button"
                    className="btn-pill-primary"
                    style={{ padding: "0.45rem 1.1rem", fontSize: "0.82rem" }}
                  >
                    📁 {t("dash_choose_btn", "Choose Image")}
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />

            {previewUrl && (
              <button
                type="button"
                onClick={handleResetAnalysis}
                className="btn-pill-secondary"
                style={{ marginTop: 8, fontSize: "0.78rem", padding: "0.35rem 0.8rem", alignSelf: "center" }}
              >
                {t("btn_clear", "Clear")}
              </button>
            )}
          </div>

          {/* Card 2: Detection Result */}
          <div className="m-card-clean">
            <div className="m-card-title">
              <span style={{ color: "#2e7d32" }}>✓</span>
              <span>{t("dash_detect_result", "Detection Result")}</span>
            </div>

            {analyzing ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner" style={{ margin: "1rem auto" }} />
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{t("msg_analyzing", "Analyzing leaf image...")}</p>
              </div>
            ) : result ? (
              <>
                <div className="detect-result-flex">
                  <div className="detect-thumb-box">
                    <img src={previewUrl} alt="Detected Leaf" />
                  </div>
                  <div className="detect-info-text">
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      {t("dash_disease_detected", "Disease Detected:")}
                    </span>
                    <strong style={{ color: result.label === "Healthy" ? "#2e7d32" : "#1b5e20" }}>
                      {result.label || "Inconclusive"}
                    </strong>
                    <p>
                      {t("dash_confidence", "Confidence:")}{" "}
                      <strong>{((result.confidence || 0) * 100).toFixed(1)}%</strong>
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <button
                    onClick={() => treatmentSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="btn-pill-secondary"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.82rem", padding: "0.5rem" }}
                  >
                    {t("dash_view_gradcam", "View Grad-CAM Result →")}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1rem" }}>
                <span style={{ fontSize: "2rem", opacity: 0.6, marginBottom: 6 }}>🍃</span>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {t("dash_waiting_upload", "Waiting for leaf upload...")}
                </p>
              </div>
            )}
          </div>

          {/* Card 3: Grad-CAM Analysis */}
          <div className="m-card-clean">
            <div className="m-card-title">
              <span style={{ color: "#2d6a4f" }}>🎯</span>
              <span>{t("dash_gradcam_title", "Grad-CAM Analysis")}</span>
            </div>

            {result && result.gradcam_image ? (
              <div className="gradcam-display">
                <div className="gradcam-img-box">
                  <img
                    src={`data:image/jpeg;base64,${result.gradcam_image}`}
                    alt="Grad-CAM Heatmap"
                  />
                </div>
                <div className="gradcam-colorbar">
                  <div className="colorbar-gradient" />
                  <div className="colorbar-labels">
                    <span>{t("dash_high_attention", "High Attention")}</span>
                    <span>{t("dash_low_attention", "Low Attention")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1rem" }}>
                <span style={{ fontSize: "2rem", opacity: 0.6, marginBottom: 6 }}>🎯</span>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {t("dash_waiting_upload", "Waiting for leaf upload...")}
                </p>
              </div>
            )}

            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "auto" }}>
              {t("dash_gradcam_hint", "Highlighted areas indicate disease-affected regions.")}
            </p>
          </div>

          {/* Right Column: Chatbot & Voice Assistant */}
          <div className="side-cards-col">
            <div className="mascot-chat-card">
              <div className="mascot-avatar-circle">
                <RobotMascotGraphic size={54} />
              </div>
              <h4 style={{ fontSize: "0.9rem", color: "var(--primary-dark)", margin: "4px 0" }}>
                {t("dash_chatbot_title", "AloeMithra Chatbot")}
              </h4>
              <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 8 }}>
                {t("dash_chatbot_desc", "Ask me anything about Aloe Vera plants!")}
              </p>
              <Link
                to="/chatbot"
                className="btn-pill-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.45rem", fontSize: "0.8rem" }}
              >
                {t("dash_chat_now", "Chat Now")} 💬
              </Link>
            </div>

            <div className="voice-wave-card">
              <Link to="/voice" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.3rem" }}>🎙️</span>
                  <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--primary-dark)" }}>
                    {t("dash_voice_title", "Voice Assistant")}
                  </span>
                </div>
                <VoiceWaveGraphic />
                <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("dash_voice_tap", "Tap to speak...")}
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================
            TREATMENT SUGGESTIONS: APPEARS ONLY ACCORDING TO DETECTED DISEASE!
           ============================================================ */}
        {result && (result.status === "confident" || result.status === "possible") && conditionKB && (
          <section
            ref={treatmentSectionRef}
            className="card"
            style={{
              padding: "1.6rem",
              marginBottom: "1.4rem",
              boxShadow: "var(--shadow-card)",
              animation: "fadeIn 0.3s ease-in-out",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.4rem" }}>💊</span>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
                    {t("dash_treatment_title", "Treatment & Care for:")} {conditionKB.condition}
                  </h3>
                </div>
                <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: 4 }}>
                  {t("dash_treatment_subtitle", "Showing tailored scientific treatment steps specifically for the detected condition.")}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={`category-pill ${conditionKB.type === "environmental" ? "category-environmental" : "category-disease"}`}>
                  {t("lbl_condition_type", "Category")}: {conditionKB.type}
                </span>

                <span
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--primary-deep)",
                    padding: "5px 14px",
                    borderRadius: 999,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "1px solid var(--accent-border)",
                  }}
                >
                  {t("lbl_status_badge", "Status")}: {conditionKB.status}
                </span>
              </div>
            </div>

            {/* Description & Symptoms Box for this detected condition */}
            <div
              style={{
                background: "var(--accent-soft)",
                border: "1px solid var(--accent-border)",
                borderRadius: 14,
                padding: "1rem 1.2rem",
                marginBottom: "1.2rem",
              }}
            >
              <h4 style={{ fontSize: "1.05rem", color: "var(--primary-dark)", margin: "0 0 6px 0" }}>
                📖 {t("lbl_description", "What is")} {conditionKB.condition}?
              </h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.55 }}>
                {conditionKB.description}
              </p>

              <h5 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--primary-deep)", margin: "10px 0 6px 0" }}>
                🔎 {t("lbl_symptoms", "Key Symptoms Observed on Leaf:")}
              </h5>
              <ul style={{ paddingLeft: 18, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                {conditionKB.symptoms?.map((s, i) => (
                  <li key={i}>🍃 {s}</li>
                ))}
              </ul>
            </div>

            {/* Actionable Treatment Steps for the Detected Disease */}
            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: 8 }}>
              🛠️ {t("lbl_management", "Targeted Management Steps:")}
            </h4>
            <ManagementTabs management={conditionKB.management} />

            {/* Disclaimer */}
            <div className="disclaimer" style={{ marginTop: "1.2rem" }}>
              ⚠️ <em>{t("disclaimer_text", "These are general, research-based suggestions and do not replace professional agricultural diagnosis. Follow locally approved product labels.")}</em>
            </div>
          </section>
        )}

        {/* Low confidence inconclusive message */}
        {result && result.status === "retake_low_confidence" && (
          <div className="card" style={{ borderLeft: "5px solid var(--warning)", marginBottom: "1.4rem" }}>
            <span className="pill pill-warning">⚠️ {t("status_possible_title", "Low Confidence Detection")}</span>
            <p style={{ marginTop: 8, fontSize: "0.92rem", fontWeight: 600 }}>
              {t("status_retake_low_conf", "The prediction confidence is low. Please upload a clearer image or consult an agricultural expert before applying treatment.")}
            </p>
          </div>
        )}

        {/* No leaf detected message */}
        {result && result.status === "retake_no_leaf" && (
          <div className="card" style={{ borderLeft: "5px solid var(--danger)", marginBottom: "1.4rem" }}>
            <span className="pill pill-retake">⚠️ {t("status_retake_no_leaf", "No Clear Leaf Detected")}</span>
            <p style={{ marginTop: 8, fontSize: "0.92rem", fontWeight: 600 }}>
              {t("status_retake_no_leaf", "Please retake the photo: one single leaf, plain dark background, bright even lighting, and sharp focus.")}
            </p>
          </div>
        )}

        {/* ============================================================
            BOTTOM ROW: RECENT HISTORY + GLOBE BANNER
           ============================================================ */}
        <div className="dash-grid-bottom">
          <div className="history-strip-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: "var(--primary-dark)" }}>
                <span>🕒</span>
                <span>{t("dash_recent_history", "Recent History")}</span>
              </div>
              <Link
                to="/history"
                style={{ fontSize: "0.82rem", color: "var(--primary-mid)", fontWeight: 700, textDecoration: "none" }}
              >
                {t("dash_view_all", "View All →")}
              </Link>
            </div>

            <div className="history-cards-row">
              {historyItems.map((item) => (
                <div key={item.id} className="history-mini-item">
                  <div className="history-mini-thumb">
                    <img src={item.thumb} alt={item.condition} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.82rem", color: "var(--primary-dark)", display: "block" }}>
                      {item.condition}
                    </strong>
                    <span style={{ fontSize: "0.72rem", color: "#2e7d32", fontWeight: 700 }}>
                      ({(item.confidence * 100).toFixed(1)}%)
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="globe-banner-card">
            <div>
              <h4>
                {t("banner_slogan", "Together for a Greener Tomorrow ♡")}
              </h4>
            </div>
            <GlobeSproutGraphic size={75} />
          </div>
        </div>
      </main>
    </div>
  );
}
