import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp, signOut } from "../api/client";
import { useApp } from "../context/AppContext";
import { LogoIcon, AloePotGraphic } from "../components/Illustrations";
import toast from "react-hot-toast";

export default function SignIn({ initialSignUp = false }) {
  const { user, setUser, lang, setLang, t } = useApp();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authLang, setAuthLang] = useState(lang || "en");
  const [loading, setLoading] = useState(false);

  // Sync authLang when app lang changes
  useEffect(() => {
    setAuthLang(lang || "en");
  }, [lang]);

  // Handle Sign Out from existing account
  const handleSwitchAccount = async () => {
    try {
      await signOut();
      setUser(null);
      setUsername("");
      setPassword("");
      toast.success(t("auth_signed_out", "Signed out. You can now sign in with another account."));
    } catch {
      toast.error("Could not sign out. Please refresh the page.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter your username.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const fn = isSignUp ? signUp : signIn;
      const args = isSignUp ? [username.trim(), password, authLang] : [username.trim(), password];
      const { data } = await fn(...args);

      if (data.success) {
        setUser(data.user);
        if (data.user?.language) setLang(data.user.language);
        toast.success(data.message || (isSignUp ? "Account created!" : "Welcome back!"));
        navigate("/history");
      } else {
        toast.error(data.message || "Authentication failed.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("Cannot reach server. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── Active session card (another user is logged in) ───────────────────────
  if (user) {
    return (
      <div className="auth-page-container">
        <div className="auth-active-session-card">
          <div className="auth-shield-icon">🛡️</div>
          <h2>{t("auth_already_signed_in", "Account Active")}</h2>
          <p>
            {t("auth_logged_in_as", "You are currently signed in as")}{" "}
            <strong className="auth-current-username">@{user.username}</strong>
          </p>
          <div className="auth-session-actions">
            <button
              type="button"
              className="btn-pill-primary"
              onClick={() => navigate("/history")}
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem 1.2rem" }}
            >
              🌿 {t("auth_goto_history", "View My Plant History")} →
            </button>
            <button
              type="button"
              className="btn-pill-secondary auth-switch-btn"
              onClick={handleSwitchAccount}
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem 1.2rem" }}
            >
              🔒 {t("auth_switch_account", "Sign Out & Switch Account")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign In / Sign Up form ─────────────────────────────────────────────────
  return (
    <div className="auth-page-container">
      <div className="auth-split-wrapper">

        {/* ── Left green banner ── */}
        <div className="auth-left-banner">
          <div className="auth-brand-header">
            <div className="auth-logo-row">
              <LogoIcon size={38} />
              <h1 className="auth-brand-name">AloeMithra</h1>
            </div>
            <p className="auth-tagline">{t("brand_tagline", "Heal • Detect • Grow")}</p>
          </div>

          <div className="auth-plant-stage">
            <div className="auth-plant-glow" />
            <AloePotGraphic width={220} height={190} />
          </div>

          <div className="auth-quote-box">
            <p className="auth-quote-text">
              {t("banner_slogan", "Together for a Greener Tomorrow ♡")}
            </p>
          </div>
        </div>

        {/* ── Right form ── */}
        <div className="auth-right-form">
          <div className="auth-header-area">
            <h2 className="auth-title">
              {isSignUp
                ? t("auth_signup_tab", "Create Account")
                : t("auth_welcome_back", "Welcome Back!")}
            </h2>
            <p className="auth-subtitle">
              {isSignUp
                ? t("auth_signup_subtitle", "Join AloeMithra to track your plants and history")
                : t("auth_signin_subtitle", "Sign in to continue your journey with AloeMithra")}
            </p>
          </div>

          {/*
            Trick Chrome / Edge autofill: hidden fields placed first so
            the browser fills them, leaving our real inputs untouched.
          */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input type="text" name="fake_username" tabIndex={-1} readOnly />
            <input type="password" name="fake_password" tabIndex={-1} readOnly />
          </div>

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="auth-form-body"
            noValidate
          >
            {/* Username */}
            <div className="auth-field-group">
              <label htmlFor="am-username" className="auth-field-label">
                {t("auth_username", "Username")}
              </label>
              <div className="auth-input-container">
                <span className="auth-input-leading-icon" aria-hidden="true">👤</span>
                <input
                  id="am-username"
                  type="text"
                  className="auth-text-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="new-password"
                  spellCheck={false}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label htmlFor="am-password" className="auth-field-label">
                {t("auth_password", "Password")}
              </label>
              <div className="auth-input-container">
                <span className="auth-input-leading-icon" aria-hidden="true">🔒</span>
                <input
                  id="am-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-text-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Minimum 6 characters" : "Enter your password"}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-pw-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            {/* Language choice (Sign Up only) */}
            {isSignUp && (
              <div className="auth-field-group">
                <label htmlFor="am-lang" className="auth-field-label">
                  {t("auth_language", "Preferred Language")}
                </label>
                <select
                  id="am-lang"
                  className="auth-select-input"
                  value={authLang}
                  onChange={(e) => setAuthLang(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>
            )}

            {/* Remember Me & Forgot Password (Sign In only) */}
            {!isSignUp && (
              <div className="auth-options-row">
                <label className="auth-remember-label">
                  <input
                    type="checkbox"
                    className="auth-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t("auth_remember_me", "Remember Me")}</span>
                </label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => toast("Contact support to reset your password.", { icon: "🔑" })}
                >
                  {t("auth_forgot_pw", "Forgot Password?")}
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading
                ? "⏳ Please wait..."
                : isSignUp
                ? `${t("auth_btn_signup", "Create Account")} →`
                : `${t("auth_btn_signin", "Sign In")} →`}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider-wrap">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">{t("auth_or", "or")}</span>
          </div>

          {/* Social */}
          <div className="auth-social-row">
            <button
              type="button"
              className="auth-social-pill"
              onClick={() => toast("Google Sign-In coming soon!", { icon: "🔜" })}
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
              className="auth-social-pill"
              onClick={() => toast("Apple Sign-In coming soon!", { icon: "🔜" })}
              title="Sign in with Apple"
            >
              <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>🍏</span>
            </button>
            <button
              type="button"
              className="auth-social-pill"
              onClick={() => toast("Microsoft Sign-In coming soon!", { icon: "🔜" })}
              title="Sign in with Microsoft"
            >
              <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>🪟</span>
            </button>
          </div>

          {/* Toggle Sign In / Sign Up */}
          <div className="auth-footer-toggle">
            {isSignUp ? (
              <p>
                {t("auth_have_account", "Already have an account?")}{" "}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => { setIsSignUp(false); setUsername(""); setPassword(""); }}
                >
                  {t("auth_signin_tab", "Sign In")}
                </button>
              </p>
            ) : (
              <p>
                {t("auth_no_account", "Don't have an account?")}{" "}
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => { setIsSignUp(true); setUsername(""); setPassword(""); }}
                >
                  {t("auth_signup_tab", "Create Account")}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
