import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { analyzeLeaf, getCondition } from "../api/client";
import ManagementTabs from "../components/ManagementTabs";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function Analyze() {
  const { user, t } = useApp();
  const [image, setImage]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [consent, setConsent]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [kbData, setKbData]       = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const fileRef                   = useRef(null);
  const treatmentRef              = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setKbData(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast.error(t("msg_please_provide_image", "Please capture or upload an image first."));
      return;
    }
    setLoading(true);
    setResult(null);
    setKbData(null);

    try {
      const fd = new FormData();
      fd.append("image", image);
      fd.append("consent_photo", consent.toString());
      const { data } = await analyzeLeaf(fd);
      setResult(data);

      // ONLY fetch and reveal treatment suggestions for the detected disease
      if (data.label && (data.status === "confident" || data.status === "possible")) {
        const kb = await getCondition(data.label);
        setKbData(kb.data);
        setTimeout(() => {
          treatmentRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 350);
      }
      toast.success(t("status_confident_title", "Analysis complete!"));
    } catch {
      toast.error(t("msg_analyzing", "Analysis failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setKbData(null);
  };

  const confidenceColor = (c) => (c >= 0.7 ? "#2e7d32" : c >= 0.45 ? "#f57c00" : "#d32f2f");

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <h1>
          <span>🌿</span>
          <span>{t("analyze_title", "Analyze Aloe Vera Leaf")}</span>
        </h1>
        <p>
          {t("analyze_subtitle", "Upload an image or use your device camera to check leaf health and receive tailored treatment.")}
        </p>
      </div>

      {/* Photography Guidelines Card */}
      <details className="card" style={{ marginBottom: "1.5rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--primary-dark)", fontSize: "0.95rem" }}>
          📸 {t("tips_header", "Photography Guidelines for Accurate Results")}
        </summary>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14 }}>
          <div style={{ background: "var(--accent-soft)", padding: "10px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: "1.2rem" }}>🍃</span>
            <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--primary-deep)", marginTop: 4 }}>
              {t("tips_item_1", "Single Leaf: Focus on only one affected leaf in the frame.")}
            </strong>
          </div>
          <div style={{ background: "var(--accent-soft)", padding: "10px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: "1.2rem" }}>⬛</span>
            <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--primary-deep)", marginTop: 4 }}>
              {t("tips_item_2", "Plain Dark Background: Place the leaf on a dark, non-reflective surface.")}
            </strong>
          </div>
          <div style={{ background: "var(--accent-soft)", padding: "10px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: "1.2rem" }}>💡</span>
            <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--primary-deep)", marginTop: 4 }}>
              {t("tips_item_3", "Good Lighting: Ensure bright, even lighting without heavy shadows or glares.")}
            </strong>
          </div>
          <div style={{ background: "var(--accent-soft)", padding: "10px 14px", borderRadius: 12 }}>
            <span style={{ fontSize: "1.2rem" }}>🎯</span>
            <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--primary-deep)", marginTop: 4 }}>
              {t("tips_item_4", "Clear Focus: Hold the camera steady so the leaf texture is sharp and unblurred.")}
            </strong>
          </div>
        </div>
      </details>

      {/* Main 2-Column Analysis Workspace */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Column 1: Upload Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: "1.3rem" }}>🖼️</span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
              {t("dash_upload_title", "Upload Leaf Photo")}
            </h3>
          </div>
          <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: 14 }}>
            {t("dash_upload_desc", "Position a single leaf on a dark surface and upload to detect conditions.")}
          </p>

          <div
            className={"dropzone" + (dragOver ? " drag-over" : "")}
            style={{ flex: 1, minHeight: 200 }}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            {preview ? (
              <img src={preview} alt="Leaf Preview" />
            ) : (
              <>
                <span style={{ fontSize: "3rem", color: "#40916c", marginBottom: 8 }}>☁️</span>
                <p style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--primary-dark)", margin: "0 0 4px 0" }}>
                  {t("upload_prompt", "Choose an image file (JPG, PNG, JPEG)")}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                  {t("dash_drag_drop", "Drag & drop an image here or click to browse")}
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {preview && (
            <div style={{ marginTop: 12 }}>
              {/* Privacy Consent Checkbox */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 14, background: "var(--accent-soft)", padding: "10px 12px", borderRadius: 10 }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: 2, accentColor: "var(--primary-dark)" }}
                />
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary-deep)" }}>
                    🛡️ {t("consent_checkbox_label", "Save my photo in my history")}
                  </span>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                    {t("consent_explanation", "If unchecked, photo is discarded immediately after analysis.")}
                  </p>
                </div>
              </label>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? `⏳ ${t("msg_analyzing", "Analyzing...")}` : `⚡ ${t("btn_run_analysis", "Analyze Leaf Now")}`}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleReset}
                  title="Clear photo"
                >
                  {t("btn_clear", "Clear")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Diagnosis & Grad-CAM Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: "1.3rem" }}>🎯</span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
              {t("dash_detect_result", "Diagnosis & Attention Map")}
            </h3>
          </div>

          {loading ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="spinner" />
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{t("msg_analyzing", "Running neural network inference...")}</p>
            </div>
          ) : result ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Status pill */}
              <div style={{ marginBottom: 10 }}>
                {result.status === "confident" && (
                  <span className="pill pill-detected">✓ {t("status_confident_title", "Condition Detected")}</span>
                )}
                {result.status === "possible" && (
                  <span className="pill pill-warning">⚠️ {t("status_possible_title", "Possible Condition (Moderate Confidence)")}</span>
                )}
                {result.status === "retake_low_confidence" && (
                  <span className="pill pill-warning">⚠️ {t("status_retake_low_conf", "Inconclusive Detection")}</span>
                )}
                {result.status === "retake_no_leaf" && (
                  <span className="pill pill-retake">⚠️ {t("status_retake_no_leaf", "No Leaf Detected")}</span>
                )}
              </div>

              {/* Detected Condition Title */}
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 4px 0" }}>
                {result.label || "Low Confidence"}
              </h2>

              {kbData && (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 10px 0" }}>
                  {t("lbl_condition_type", "Category")}: <strong>{kbData.type?.toUpperCase()}</strong> • {t("lbl_status_badge", "Status")}: <strong>{kbData.status}</strong>
                </p>
              )}

              {/* Confidence Progress Meter */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, color: "var(--primary-dark)" }}>
                  <span>{t("lbl_confidence", "Confidence")}</span>
                  <span style={{ color: confidenceColor(result.confidence) }}>
                    {((result.confidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="confidence-bar-track">
                  <div
                    className="confidence-bar-fill"
                    style={{
                      width: `${(result.confidence || 0) * 100}%`,
                      background: confidenceColor(result.confidence),
                    }}
                  />
                </div>
              </div>

              {/* Grad-CAM Heatmap Preview */}
              {result.gradcam_image && (
                <div style={{ marginTop: "auto", border: "1px solid var(--accent-border)", borderRadius: 14, overflow: "hidden", background: "var(--accent-soft)", padding: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary-deep)" }}>
                      {t("dash_gradcam_title", "Grad-CAM Attention Heatmap")}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Visual explanation</span>
                  </div>
                  <div style={{ height: 140, borderRadius: 10, overflow: "hidden" }}>
                    <img
                      src={`data:image/jpeg;base64,${result.gradcam_image}`}
                      alt="Grad-CAM Heatmap"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "1.5rem 1rem", background: "var(--accent-soft)", borderRadius: 14, border: "1.5px dashed var(--accent-border)" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)", border: "1.5px solid var(--accent-border)" }}>
                🪴
              </div>
              <span className="pill pill-detected" style={{ marginBottom: 10, fontSize: "0.76rem" }}>
                🔍 {t("dash_waiting_upload", "Awaiting Leaf Photo")}
              </span>
              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 6px 0" }}>
                {t("dash_detect_result", "Diagnosis & Attention Map")}
              </h4>
              <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", margin: "0 0 16px 0", maxWidth: 320, lineHeight: 1.5 }}>
                {t("dash_upload_desc", "Upload or capture a leaf photo on the left to see the diagnosis and Grad-CAM visual attention.")}
              </p>

              <div style={{ width: "100%", maxWidth: 300, display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
                <div style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--accent-border)", fontSize: "0.8rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🩺</span>
                  <span><strong>AI Condition Diagnosis</strong></span>
                </div>
                <div style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--accent-border)", fontSize: "0.8rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🎯</span>
                  <span><strong>Grad-CAM Visual Heatmap</strong></span>
                </div>
                <div style={{ background: "var(--bg-card)", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--accent-border)", fontSize: "0.8rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>💊</span>
                  <span><strong>Targeted Research Treatments</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          TREATMENT SECTION: APPEARS ONLY AFTER DETECTION AND
          SPECIFICALLY FOR THE DETECTED DISEASE!
         ============================================================ */}
      {result && (result.status === "confident" || result.status === "possible") && kbData && (
        <section
          ref={treatmentRef}
          className="card"
          style={{
            animation: "fadeIn 0.3s ease-in-out",
            border: "2px solid #a7d7b5",
            boxShadow: "0 8px 24px rgba(22, 62, 35, 0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.5rem" }}>💊</span>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary-dark)", margin: 0 }}>
                  {t("dash_treatment_title", "Targeted Treatment for:")} {kbData.condition}
                </h3>
              </div>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 4 }}>
                {t("dash_treatment_subtitle", "Recommended management plan specific to")} {kbData.condition}.
              </p>
            </div>

            <span className={`category-pill ${kbData.type === "environmental" ? "category-environmental" : "category-disease"}`}>
              {t("lbl_condition_type", "Category")}: {kbData.type}
            </span>
          </div>

          {/* Condition Description & Key Symptoms */}
          <div style={{ background: "var(--bg-page)", border: "1px solid var(--accent-border)", borderRadius: 14, padding: "1.2rem", marginBottom: "1.2rem" }}>
            <h4 style={{ fontSize: "1rem", color: "var(--primary-dark)", margin: "0 0 6px 0" }}>
              📖 {t("lbl_description", "What is")} {kbData.condition}?
            </h4>
            <p style={{ fontSize: "0.92rem", color: "var(--text-main)", lineHeight: 1.6, margin: "0 0 12px 0" }}>
              {kbData.description}
            </p>

            <h5 style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--primary-deep)", margin: "0 0 6px 0" }}>
              🔎 {t("lbl_symptoms", "Key Symptoms Observed on Leaf:")}
            </h5>
            <ul style={{ paddingLeft: 18, fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
              {kbData.symptoms?.map((s, i) => (
                <li key={i}>🍃 {s}</li>
              ))}
            </ul>
          </div>

          {/* Special Safety Alert for Sunburn */}
          {kbData.slug === "sunburn" && (
            <div className="alert-sunburn-card">
              <span style={{ fontSize: "1.6rem" }}>☀️</span>
              <div>
                <strong>Strict Safety Rule: Do NOT treat with fungicides!</strong>
                <p>
                  Sunburn is abiotic solar UV/heat injury, NOT an infection. Fungicides will exacerbate leaf scorch. Move the plant to bright indirect light or deploy a 30-50% shade cloth during midday heat.
                </p>
              </div>
            </div>
          )}

          {/* Special Protocol for Healthy Plants */}
          {kbData.slug === "healthy" && (
            <div className="alert-healthy-card">
              <span style={{ fontSize: "1.6rem" }}>🌱</span>
              <div>
                <strong>Preventive Care Routine</strong>
                <p>
                  No chemical treatments required. Maintain soak-and-dry watering and clean containers with bottom drainage.
                </p>
              </div>
            </div>
          )}

          {/* 5 Targeted Treatment Tabs for this disease */}
          <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--primary-dark)", marginBottom: 10 }}>
            🛠️ {t("lbl_management", "Actionable Care Steps for")} {kbData.condition}:
          </h4>
          <ManagementTabs management={kbData.management} />

          {/* Bottom Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: "1.5rem" }}>
            <button
              className="btn btn-primary"
              onClick={handleReset}
            >
              📷 {t("btn_analyze_another", "Analyze Another Leaf")}
            </button>
            <Link
              to="/history"
              className="btn btn-outline"
            >
              🕒 {t("nav_history", "View In History")}
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer">
            ⚠️ <em>{t("disclaimer_text", "These are general, research-based suggestions and do not replace professional agricultural diagnosis. Always follow locally approved product labels.")}</em>
          </div>
        </section>
      )}

      {/* Retake & Inconclusive Alerts */}
      {result && result.status === "retake_low_confidence" && (
        <div className="card" style={{ borderLeft: "5px solid var(--warning)" }}>
          <span className="pill pill-warning">⚠️ {t("status_possible_title", "Low Confidence Inconclusive")}</span>
          <p style={{ marginTop: 10, fontSize: "0.95rem", fontWeight: 600 }}>
            {t("status_retake_low_conf", "The prediction confidence is low. Please upload a clearer image or consult an agricultural expert.")}
          </p>
          <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={handleReset}>
            {t("btn_retake", "Retake Photo")}
          </button>
        </div>
      )}

      {result && result.status === "retake_no_leaf" && (
        <div className="card" style={{ borderLeft: "5px solid var(--danger)" }}>
          <span className="pill pill-retake">⚠️ {t("status_retake_no_leaf", "No Clear Leaf Detected")}</span>
          <p style={{ marginTop: 10, fontSize: "0.95rem", fontWeight: 600 }}>
            {t("status_retake_no_leaf", "No clear Aloe vera leaf detected. Please take another photo: one leaf, plain dark background, good light, in focus.")}
          </p>
          <button className="btn btn-outline" style={{ marginTop: 10 }} onClick={handleReset}>
            {t("btn_retake", "Retake Photo")}
          </button>
        </div>
      )}
    </div>
  );
}
