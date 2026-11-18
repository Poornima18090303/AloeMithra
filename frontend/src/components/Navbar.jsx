import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LogoIcon } from "./Illustrations";
import { signOut as apiSignOut } from "../api/client";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, setUser, lang, setLang, theme, toggleTheme, t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target)) {
        setAboutOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await apiSignOut();
    setUser(null);
  };

  const handleToggleTheme = () => {
    toggleTheme();
    toast(theme === "light" ? t("msg_theme_dark", "Dark Mode active 🌙") : t("msg_theme_light", "Light Mode active ☀️"));
  };

  // "Features" scroll: on home page scroll to section; on other pages navigate home then scroll
  const handleFeaturesClick = (e) => {
    e.preventDefault();
    if (isHome) {
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#features");
      setTimeout(() => {
        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

  return (
    <header className="landing-nav">
      {/* Brand logo & tagline */}
      <Link to="/" className="brand-group">
        <LogoIcon size={36} />
        <div>
          <div className="brand-name">AloeMithra</div>
          <div className="brand-sub">{t("brand_tagline", "Heal • Detect • Grow")}</div>
        </div>
      </Link>

      {/* Nav Links */}
      <nav className="landing-links">
        <NavLink to="/" end className={({ isActive }) => "landing-pill-link" + (isActive ? " active" : "")}>
          <span style={{ marginRight: 4 }}>🏠</span>
          {t("nav_home", "Home")}
        </NavLink>

        {/* About Project — collapsed into a dropdown */}
        <div className="nav-dropdown-wrap" ref={aboutRef}>
          <button
            className={"landing-pill-link nav-dropdown-trigger" + (location.pathname === "/about" ? " active" : "")}
            onClick={() => setAboutOpen((o) => !o)}
            type="button"
          >
            {t("nav_about", "About")} {aboutOpen ? "▴" : "▾"}
          </button>
          {aboutOpen && (
            <div className="nav-dropdown-panel">
              <Link
                to="/about"
                className="nav-dropdown-item"
                onClick={() => setAboutOpen(false)}
              >
                🌿 {t("nav_about", "About Project")}
              </Link>
              <Link
                to="/about#tech"
                className="nav-dropdown-item"
                onClick={() => setAboutOpen(false)}
              >
                🛠️ {t("about_dev_toggle_title_short", "Tech & Model Info")}
              </Link>
            </div>
          )}
        </div>

        {/* Features — only scrolls on home, navigates on other pages */}
        <a href="#features" className="landing-pill-link" onClick={handleFeaturesClick}>
          {t("nav_features", "Features")} ▾
        </a>

        <NavLink to="/history" className={({ isActive }) => "landing-pill-link" + (isActive ? " active" : "")}>
          {t("nav_history", "History")}
        </NavLink>
        <NavLink to="/chatbot" className={({ isActive }) => "landing-pill-link" + (isActive ? " active" : "")}>
          {t("nav_contact", "Contact")}
        </NavLink>
      </nav>

      {/* Right Controls: Theme Toggle, Language Selector, Sign In */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Day/Night Theme Icon */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="icon-btn-circle"
          style={{ width: 36, height: 36, fontSize: "1rem" }}
          title={theme === "dark" ? t("theme_toggle_day", "Light Mode") : t("theme_toggle_dark", "Dark Mode")}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* Language Selector */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label={t("lbl_select_language", "Select Language")}
          className="theme-select-pill"
          style={{
            border: "1.5px solid var(--accent-border)",
            borderRadius: 999,
            padding: "5px 12px",
            fontSize: "0.82rem",
            color: "var(--text-main)",
            background: "var(--bg-card)",
            cursor: "pointer",
            outline: "none",
            fontWeight: 600,
          }}
        >
          <option value="en">English</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
          <option value="hi">हिन्दी (Hindi)</option>
        </select>

        {user ? (
          <button
            className="btn-pill-primary"
            style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}
            onClick={handleSignOut}
          >
            👤 {user.username} · {t("auth_btn_signout", "Sign Out")}
          </button>
        ) : (
          <Link
            to="/signin"
            className="btn-pill-primary"
            style={{ padding: "0.55rem 1.35rem", fontSize: "0.88rem" }}
          >
            👤 {t("auth_signin_tab", "Sign In")}
          </Link>
        )}
      </div>
    </header>
  );
}
