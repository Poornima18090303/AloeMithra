import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp, getHistory, deleteRecord, clearHistory } from "../api/client";
import { useApp } from "../context/AppContext";
import { LogoIcon, AloePotGraphic } from "../components/Illustrations";
import toast from "react-hot-toast";

function AuthSplitScreen({ setUser }) {
  const { lang, setLang, t }    = useApp();
  const navigate                = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authLang, setAuthLang] = useState(lang || "en");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fn = isSignUp ? signUp : signIn;
      const args = isSignUp ? [username, password, authLang] : [username, password];
      const { data } = await fn(...args);
      if (data.success) {
        setUser(data.user);
        if (data.user?.language) {
          setLang(data.user.language);
        }
        toast.success(data.message);
        // After sign-in / sign-up, go straight to the Analyze page
        navigate("/analyze");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem 1rem", minHeight: "85vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="auth-split-wrapper">
        {/* Left Side: Dark Green with Aloe plant illustration */}
        <div className="auth-left-banner">
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
              <LogoIcon size={38} />
              <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                AloeMithra
              </h2>
            </div>
            <p style={{ color: "#a7d7b5", fontSize: "0.95rem" }}>
              {t("brand_tagline", "Heal • Detect • Grow")}
            </p>
          </div>

          <div style={{ margin: "2rem 0" }}>
            <AloePotGraphic width={220} height={190} />
          </div>

          <div>
            <p style={{ fontFamily: "'Caveat', cursive", fontSize: "1.5rem", color: "#d8f3dc", margin: 0 }}>
              {t("banner_slogan", "Together for a Greener Tomorrow ♡")}
            </p>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="auth-right-form">
          <h2 style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--primary-dark)", margin: "0 0 6px 0" }}>
            {isSignUp ? t("auth_signup_tab", "Create Account") : t("auth_welcome_back", "Welcome Back!")}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", margin: "0 0 1.5rem 0" }}>
            {isSignUp
              ? t("auth_signup_subtitle", "Join AloeMithra to keep track of your plants")
              : t("auth_signin_subtitle", "Sign in to continue your journey with AloeMithra")}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary-deep)" }}>
                {t("auth_username", "Email Address / Username")}
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: 11, color: "var(--text-muted)" }}>✉</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@example.com or username"
                  style={{ paddingLeft: "2.4rem" }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary-deep)" }}>
                {t("auth_password", "Password")}
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: 11, color: "var(--text-muted)" }}>🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Minimum 6 characters" : "Enter password"}
                  style={{ paddingLeft: "2.4rem", paddingRight: "2.4rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 10,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    fontSize: "1rem",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="form-group">
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary-deep)" }}>
                  {t("auth_language", "Preferred Language")}
                </label>
                <select value={authLang} onChange={(e) => setAuthLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>
            )}

            {!isSignUp && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", fontSize: "0.82rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--text-muted)" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: "var(--primary-dark)" }}
                  />
                  <span>{t("auth_remember_me", "Remember Me")}</span>
                </label>
                <span
                  style={{ color: "var(--primary-mid)", cursor: "pointer", fontWeight: 600 }}
                  onClick={() => toast("Contact support to reset your password.")}
                >
                  {t("auth_forgot_pw", "Forgot Password?")}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="btn-pill-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem", fontSize: "0.95rem" }}
              disabled={loading}
            >
              {loading
                ? "⏳ Please wait..."
                : isSignUp
                ? `${t("auth_btn_signup", "Create Account")} →`
                : `${t("auth_btn_signin", "Sign In")} →`}
            </button>
          </form>

          {/* Social login divider */}
          <div style={{ textAlign: "center", margin: "1.2rem 0 0.8rem", color: "var(--text-muted)", fontSize: "0.8rem", position: "relative" }}>
            <span style={{ background: "var(--bg-card)", padding: "0 10px", position: "relative", zIndex: 1 }}>{t("auth_or", "or")}</span>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--accent-border)" }} />
          </div>

          {/* Social icons */}
          <div className="social-login-row">
            <button
              type="button"
              className="social-icon-btn"
              onClick={() => toast("Google authentication")}
              title="Sign in with Google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </button>
            <button
              type="button"
              className="social-icon-btn"
              onClick={() => toast("Apple authentication")}
              title="Sign in with Apple"
            >
              <span style={{ fontSize: "1.2rem" }}>🍏</span>
            </button>
            <button
              type="button"
              className="social-icon-btn"
              onClick={() => toast("Microsoft authentication")}
              title="Sign in with Microsoft"
            >
              <span style={{ fontSize: "1.1rem" }}>🪟</span>
            </button>
          </div>

          {/* Toggle between Sign In & Sign Up */}
          <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "1rem" }}>
            {isSignUp ? (
              <>
                {t("auth_have_account", "Already have an account?")}{" "}
                <strong
                  style={{ color: "var(--primary-dark)", cursor: "pointer" }}
                  onClick={() => setIsSignUp(false)}
                >
                  {t("auth_signin_tab", "Sign In")}
                </strong>
              </>
            ) : (
              <>
                {t("auth_no_account", "Don't have an account?")}{" "}
                <strong
                  style={{ color: "var(--primary-dark)", cursor: "pointer" }}
                  onClick={() => setIsSignUp(true)}
                >
                  {t("auth_signup_tab", "Sign Up")}
                </strong>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function HistoryScreen({ user }) {
  const { t } = useApp();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getHistory();
      setRecords(data);
    } catch {
      toast.error("Could not load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    await deleteRecord(id);
    setRecords((r) => r.filter((x) => x.id !== id));
    toast.success("Record deleted.");
  };

  const handleClearAll = async () => {
    if (!window.confirm(t("history_clear_confirm", "Are you sure you want to permanently delete all history records?"))) return;
    await clearHistory();
    setRecords([]);
    toast.success("History cleared.");
  };

  if (loading) return <div className="spinner" style={{ marginTop: "3rem" }} />;

  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary-dark)" }}>
            🕒 {t("history_title", "Leaf Analysis History")}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>
            {t("auth_logged_in_as", "Logged in as")}: <strong>{user.username}</strong>
          </p>
        </div>
        {records.length > 0 && (
          <button
            className="btn btn-danger"
            style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            onClick={handleClearAll}
          >
            {t("history_btn_clear_all", "Clear All History")}
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <span style={{ fontSize: "3.2rem" }}>🪴</span>
          <h4 style={{ marginTop: 10, fontSize: "1.1rem" }}>{t("history_empty", "No analysis records found.")}</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
            {t("analyze_subtitle", "Upload an image or use your camera to check leaf health.")}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
            <span className="pill pill-detected">All ({records.length})</span>
          </div>
          {records.map((r) => (
            <div key={r.id} className="history-record" style={{ background: "var(--bg-card)", padding: "12px 16px", borderRadius: 14, marginBottom: 10, border: "1px solid var(--accent-border)" }}>
              <div className="history-thumb">
                {r.thumbnail && r.consent_photo_saved ? (
                  <img src={`data:image/jpeg;base64,${r.thumbnail}`} alt="thumb" />
                ) : (
                  "🌿"
                )}
              </div>
              <div style={{ flex: 1, paddingLeft: 8 }}>
                <strong style={{ fontSize: "1rem", color: "var(--primary-dark)" }}>
                  {r.condition || "Low Confidence Detection"}
                </strong>
                <div style={{ marginTop: 4 }}>
                  <span className="pill pill-detected" style={{ fontSize: "0.74rem" }}>
                    {((r.confidence || 0) * 100).toFixed(1)}% {t("lbl_confidence", "confidence")}
                  </span>
                </div>
                <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: 4 }}>
                  🗓️ {r.timestamp}
                  {!r.consent_photo_saved && (
                    <span style={{ display: "block", color: "#888", fontStyle: "italic", fontSize: "0.72rem" }}>
                      ({t("history_photo_not_saved", "Photo omitted by user consent")})
                    </span>
                  )}
                </p>
              </div>
              <button
                className="btn btn-danger"
                style={{ padding: "6px 12px", fontSize: "1rem" }}
                onClick={() => handleDelete(r.id)}
                title={t("history_btn_delete", "Delete")}
              >
                🗑️
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function History() {
  const { user, setUser } = useApp();
  if (!user) return <AuthSplitScreen setUser={setUser} />;
  return <HistoryScreen user={user} />;
}
