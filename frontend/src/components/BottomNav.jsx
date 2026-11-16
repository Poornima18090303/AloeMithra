import React from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function BottomNav() {
  const { t } = useApp();

  const links = [
    { to: "/",        icon: "🏠", label: t("nav_home", "Home") },
    { to: "/analyze", icon: "🔬", label: t("nav_analyze", "Analyze") },
    { to: "/history", icon: "🕒", label: t("nav_history", "History") },
    { to: "/chatbot", icon: "💬", label: t("nav_chat", "Chat") },
    { to: "/voice",   icon: "🎙️", label: t("nav_voice", "Voice") },
    { to: "/about",   icon: "⚙️", label: t("nav_about", "About") },
  ];

  return (
    <nav className="bottom-nav">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/"}
          className={({ isActive }) => "bnav-item" + (isActive ? " active" : "")}
        >
          <span className="icon">{l.icon}</span>
          <span style={{ whiteSpace: "nowrap" }}>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
