import React, { useState, useEffect, useRef } from "react";
import { chatMessage } from "../api/client";
import { useApp } from "../context/AppContext";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function VoiceAssistant() {
  const { lang, t } = useApp();
  const [query, setQuery]             = useState("");
  const [response, setResp]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const recognitionRef                = useRef(null);

  // Map app language code to speech locale code
  const getSpeechLang = (appLang) => {
    if (appLang === "kn") return "kn-IN";
    if (appLang === "hi") return "hi-IN";
    return "en-US";
  };

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = getSpeechLang(lang);

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        ask(transcript);
      };

      rec.onerror = (event) => {
        setIsListening(false);
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone permissions in your browser.");
        } else if (event.error !== "no-speech") {
          toast.error(`Voice recognition error: ${event.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [lang]);

  // Toggle voice listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      // Stop ongoing speech synthesis before listening
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.lang = getSpeechLang(lang);
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    }
  };

  // Speak text aloud using SpeechSynthesis
  const speakText = (rawText) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for natural vocal output
    const cleanText = rawText
      .replace(/[*#_~`>•-]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getSpeechLang(lang);
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Ask assistant
  const ask = async (qText) => {
    const text = qText || query.trim();
    if (!text) return;
    setQuery(text);
    setLoading(true);
    setResp("");

    try {
      const { data } = await chatMessage(text);
      setResp(data.reply);
      // Auto-read response aloud if speech recognition was used
      if ("speechSynthesis" in window) {
        speakText(data.reply);
      }
    } catch {
      toast.error("Could not reach assistant backend.");
    } finally {
      setLoading(false);
    }
  };

  const QUICK_QUERIES = [
    { label: "🍂 How to treat rust?", query: "How to treat rust on Aloe vera?" },
    { label: "☀️ Why are leaves red?", query: "Why are my aloe vera leaves turning red or sunburned?" },
    { label: "🥀 What is anthracnose?", query: "What is anthracnose disease in Aloe vera?" },
    { label: "💧 Best watering schedule?", query: "What is the best watering schedule for healthy aloe vera?" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>🎙️ {t("voice_title", "Voice Assistant")}</h1>
        <p>{t("voice_ask_prompt", "Ask anything about Aloe Vera plants...")}</p>
      </div>

      {/* Mic circle with tap-to-speak */}
      <div style={{ textAlign: "center", margin: "1.2rem 0" }}>
        <button
          type="button"
          onClick={toggleListening}
          aria-label={isListening ? "Listening" : "Tap to Speak"}
          style={{
            border: "none",
            cursor: "pointer",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: isListening
              ? "linear-gradient(135deg, #e53935 0%, #b71c1c 100%)"
              : "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
            color: "#ffffff",
            fontSize: "3.5rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isListening
              ? "0 0 0 16px rgba(229,57,53,0.25), 0 0 0 32px rgba(229,57,53,0.12)"
              : "0 0 0 16px rgba(76,175,80,0.18), 0 0 0 32px rgba(76,175,80,0.08)",
            transition: "all 0.3s ease",
            transform: isListening ? "scale(1.05)" : "scale(1)",
          }}
        >
          {isListening ? "🔴" : "🎙️"}
        </button>

        <h3 style={{ color: isListening ? "#c62828" : "var(--green-dark)", fontWeight: 800, marginTop: "1rem" }}>
          {isListening
            ? t("voice_listening", "Listening... Speak now")
            : t("voice_tap_speak", "Tap to Speak")}
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          {isListening
            ? "Tap the red button to finish"
            : `Using ${getSpeechLang(lang)} (${lang.toUpperCase()})`}
        </p>
      </div>

      {/* Spoken/typed Query Input */}
      <div className="chat-dock-bar" style={{ borderRadius: "var(--radius-pill)", border: "1.5px solid var(--accent-border)", marginTop: "1rem", boxShadow: "var(--shadow-card)" }}>
        <input
          className="chat-dock-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder={t("voice_ask_prompt", "e.g. 'What are the red patches on my aloe?'")}
          disabled={loading}
          style={{ border: "none", background: "transparent" }}
        />
        <button className="chat-send-btn" onClick={() => ask()} disabled={loading || !query.trim()}>
          ➤
        </button>
      </div>

      {/* Response card */}
      {loading && <div className="spinner" style={{ margin: "2rem auto" }} />}
      {response && !loading && (
        <div className="card" style={{ borderLeft: "5px solid var(--primary-mid)", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase", margin: 0 }}>
              🌿 {t("nav_voice", "Voice Assistant Guidance")}:
            </p>
            <button
              className="action-pill-btn"
              style={{ background: "var(--accent-soft)", padding: "5px 12px", borderRadius: 999 }}
              onClick={() => speakText(response)}
            >
              {isSpeaking ? "⏹️ Stop" : "🔊 Read Aloud"}
            </button>
          </div>
          <div style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--text-main)" }}>
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Quick query chips */}
      <div style={{ marginTop: "1.8rem" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          {t("voice_common_queries", "Common Voice Queries:")}
        </p>
        <div className="chat-chips-grid">
          {QUICK_QUERIES.map((q) => (
            <button key={q.label} className="chat-suggest-chip" onClick={() => ask(q.query)}>
              🗣️ {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mascot banner */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: "1.5rem",
          background: "var(--green-light)",
          borderColor: "var(--green-border)",
        }}
      >
        <span style={{ fontSize: "2.5rem" }}>🪴</span>
        <div>
          <p style={{ fontWeight: 700, color: "var(--green-dark)", fontSize: "0.95rem", margin: 0 }}>
            "{t("voice_listening_mascot", "I'm listening... ♡")}"
          </p>
          <p style={{ color: "var(--text-mid)", fontSize: "0.82rem", margin: "2px 0 0 0" }}>
            {t("voice_companion_sub", "Your voice companion for healthy Aloe vera cultivation.")}
          </p>
        </div>
      </div>
    </div>
  );
}
