import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function ManagementTabs({ management }) {
  const { t } = useApp();
  const [active, setActive] = useState("sanitation");

  const TABS = [
    { key: "sanitation",   label: `🧹 ${t("lbl_sanitation", "Sanitation & Pruning")}` },
    { key: "cultural",     label: `🌱 ${t("lbl_cultural", "Cultural Practices")}` },
    { key: "biological",   label: `🦠 ${t("lbl_biological", "Biological Controls")}` },
    { key: "chemical",     label: `🧪 ${t("lbl_chemical", "Chemical Controls")}` },
    { key: "precautions",  label: `⚠️ ${t("lbl_precautions", "Safety Precautions")}` },
  ];

  const steps = management?.[active] || [];

  return (
    <div>
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={"tab-btn" + (active === tab.key ? " active" : "")}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {steps.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {t("placeholder_research_pending", "To be added from reviewed research sources.")}
          </p>
        ) : (
          steps.map((item, i) => (
            <div key={i} className="step-card">
              <p>• {item.step}</p>
              <span className="evidence-tag">
                {t("lbl_evidence_level", "Evidence Level")}: <em>{item.evidence_level}</em>
              </span>
              {item.sources && item.sources.length > 0 && (
                <details style={{ marginTop: 6 }}>
                  <summary style={{ fontSize: "0.78rem", color: "var(--green-mid)", cursor: "pointer", fontWeight: 600 }}>
                    📚 {t("lbl_sources", "Research Sources")}
                  </summary>
                  <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                    {item.sources.map((s, j) => (
                      <li key={j} style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
