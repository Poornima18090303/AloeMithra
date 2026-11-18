import React, { useState, useEffect } from "react";
import { getHistory, deleteRecord, clearHistory } from "../api/client";
import { useApp } from "../context/AppContext";
import SignIn from "./SignIn";
import toast from "react-hot-toast";

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
  const { user } = useApp();
  if (!user) return <SignIn />;
  return <HistoryScreen user={user} />;
}
