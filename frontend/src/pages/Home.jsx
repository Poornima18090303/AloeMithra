import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import LandingHero from "../components/LandingHero";
import { LogoIcon } from "../components/Illustrations";

export default function Home() {
  const { t } = useApp();

  const FEATURES = [
    {
      title: t("feat_disease_detect_title", "Disease Detection"),
      desc: t("feat_disease_detect_desc", "Upload a leaf image and identify diseases instantly."),
      icon: "📷",
      link: "/analyze",
    },
    {
      title: t("feat_gradcam_title", "Grad-CAM Analysis"),
      desc: t("feat_gradcam_desc", "Visualize affected areas with heatmaps."),
      icon: "🎯",
      link: "/app",
    },
    {
      title: t("feat_chat_title", "AloeMithra Chatbot"),
      desc: t("feat_chat_desc", "Ask anything about Aloe Vera care."),
      icon: "💬",
      link: "/chatbot",
    },
    {
      title: t("feat_voice_title", "Voice Assistant"),
      desc: t("feat_voice_desc", "Get help with your voice."),
      icon: "🎙️",
      link: "/voice",
    },
    {
      title: t("feat_history_title", "Saved History"),
      desc: t("feat_history_desc", "Access your past results anytime."),
      icon: "🕒",
      link: "/history",
    },
    {
      title: t("feat_care_tips_title", "Plant Care Tips"),
      desc: t("feat_care_tips_desc", "Expert tips for healthy growth."),
      icon: "🪴",
      link: "/about",
    },
  ];

  return (
    <div className="home-page-container">
      {/* Hero Banner matching mockup */}
      <LandingHero />

      {/* Our Features Section (6 Cards) */}
      <section className="features-section" id="features">
        <div className="section-title-wrap">
          <div className="section-badge">
            <span style={{ fontSize: "1.2rem" }}>🌿</span>
            <span className="section-badge-text">{t("features_title", "Our Features")}</span>
            <span style={{ fontSize: "1.2rem" }}>🌿</span>
          </div>
          <p className="section-subtext">
            {t("features_subtitle", "Everything you need for healthy and thriving Aloe Vera plants")}
          </p>
        </div>

        <div className="features-cards-grid">
          {FEATURES.map((item, idx) => (
            <Link key={idx} to={item.link} className="feature-card-item">
              <div className="feature-icon-circle">
                <span>{item.icon}</span>
              </div>
              <h3 className="feature-card-title">{item.title}</h3>
              <p className="feature-card-desc">{item.desc}</p>
              <div className="feature-arrow-btn">
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom Green Banner: "Together for a Greener Tomorrow ♡" */}
      <div className="bottom-slogan-strip">
        <div className="slogan-content-flex">
          <div className="slogan-left-logo">
            <LogoIcon size={36} />
          </div>
          <div className="slogan-center-text">
            {t("banner_slogan", "Together for a Greener Tomorrow ♡")}
          </div>
          <Link to="/analyze" className="btn-explore-pill">
            {t("banner_explore", "Explore Now →")}
          </Link>
        </div>
      </div>
    </div>
  );
}
