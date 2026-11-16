import React, { useState, useRef, useEffect } from "react";
import { chatMessage } from "../api/client";
import { useApp } from "../context/AppContext";
import { RobotMascotGraphic } from "../components/Illustrations";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function Chatbot() {
  const { user, lang, t } = useApp();

  const getWelcomeContent = () =>
    t(
      "chat_welcome_msg",
      "Hello! I am **AloeMithra AI** 🌱\n\nI am your specialized agronomist for Aloe vera health. How can I assist your plants today?\n\n**Common topics you can ask me:**\n- 🍂 **Aloe Rust** (Reddish/brown raised pustules)\n- 🥀 **Anthracnose** (Dark sunken spots with water-soaked margins)\n- 🍃 **Leaf Spot** (Fungal/bacterial circular lesions)\n- ☀️ **Sunburn** (UV scorch & environmental stress — *No fungicides!*)\n- 💧 **Watering & Soil** (Proper drainage & seasonal care)"
    );

  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: getWelcomeContent(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Update initial message when language changes if no custom messages
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "bot") {
      setMessages([
        {
          role: "bot",
          content: getWelcomeContent(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Text to speech
  const speakMessage = (text, idx) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser.");
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_~`>•-]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeakingIdx(idx);
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    window.speechSynthesis.speak(utterance);
  };

  // Copy text to clipboard
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t("chat_copied_toast", "Copied to clipboard!"));
  };

  // Voice speech-to-text mic
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-US";

    rec.onstart = () => setIsRecording(true);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      send(transcript);
      setIsRecording(false);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);

    recognitionRef.current = rec;
    rec.start();
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg, time: timeStr }]);
    setLoading(true);

    try {
      const { data } = await chatMessage(msg);
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          content: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      toast.error("Could not connect to the botanical AI server.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingIdx(null);
    setMessages([
      {
        role: "bot",
        content: getWelcomeContent(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.success(t("chat_clear_btn", "Chat cleared"));
  };

  const QUICK_TOPICS = [
    {
      label: t("chat_chip_rust", "🍂 Aloe Rust Symptoms & Cure"),
      msg: "Tell me about Aloe Rust symptoms, cause, and organic treatment.",
    },
    {
      label: t("chat_chip_sunburn", "☀️ Sunburn Recovery Guide"),
      msg: "My Aloe Vera leaf has brown/red patches from direct sun. How do I fix sunburn?",
    },
    {
      label: t("chat_chip_watering", "💧 Proper Watering Schedule"),
      msg: "How often should I water my Aloe Vera plant, and how do I prevent root rot?",
    },
    {
      label: t("chat_chip_anthracnose", "🥀 Anthracnose Management"),
      msg: "What causes anthracnose spots on Aloe Vera leaves and how do I treat it?",
    },
    {
      label: t("chat_chip_soil", "🪴 Best Soil & Potting Mix"),
      msg: "What is the best soil mix and drainage container for Aloe Vera plants?",
    },
  ];

  return (
    <div className="chat-pro-page">
      {/* Professional Header Banner */}
      <div className="chat-hero-banner">
        <div className="chat-hero-left">
          <div className="chat-avatar-frame">
            <RobotMascotGraphic size={48} />
          </div>
          <div className="chat-hero-title-group">
            <h2>
              <span>{t("chat_header_title", "AloeMithra AI Specialist")}</span>
              <span className="chat-status-pill">
                <span className="status-dot-pulse" />
                <span>{t("chat_online_status", "Online • AI Agronomist")}</span>
              </span>
            </h2>
            <p>
              {t(
                "chat_header_subtitle",
                "Instant scientific guidance for Aloe vera cultivation, disease prevention, and organic healing."
              )}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn-pill-secondary"
            onClick={handleClearChat}
            style={{
              padding: "0.45rem 1rem",
              fontSize: "0.8rem",
              borderColor: "rgba(255, 255, 255, 0.3)",
              color: "#ffffff",
              background: "rgba(0, 0, 0, 0.25)",
            }}
          >
            🧹 {t("chat_clear_btn", "Clear Chat")}
          </button>
        </div>
      </div>

      {/* Main Conversation Window Card */}
      <div className="chat-window-card">
        {/* Scrollable Message Feed */}
        <div className="chat-messages-scroll">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-row ${m.role}`}>
              <div className="msg-sender-avatar">
                {m.role === "bot" ? "🌱" : user?.username?.charAt(0).toUpperCase() || "👤"}
              </div>

              <div className="msg-bubble-content">
                <ReactMarkdown>{m.content}</ReactMarkdown>

                {m.role === "bot" && (
                  <div className="msg-bubble-actions">
                    <button
                      type="button"
                      className="action-pill-btn"
                      onClick={() => speakMessage(m.content, idx)}
                    >
                      {speakingIdx === idx ? (
                        <>
                          <span>⏹️</span>
                          <span>{t("chat_btn_stop", "Stop Speaking")}</span>
                        </>
                      ) : (
                        <>
                          <span>🔊</span>
                          <span>{t("chat_btn_read", "Read Aloud")}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="action-pill-btn"
                      onClick={() => copyMessage(m.content)}
                    >
                      <span>📋</span>
                      <span>{t("chat_btn_copy", "Copy Message")}</span>
                    </button>

                    {m.time && (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                        {m.time}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="chat-row bot">
              <div className="msg-sender-avatar">🌱</div>
              <div className="msg-bubble-content">
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="chat-suggestions-area">
          <div className="chat-suggestions-title">
            {t("chat_quick_topics", "Quick Discussion Topics:")}
          </div>
          <div className="chat-chips-grid">
            {QUICK_TOPICS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className="chat-suggest-chip"
                onClick={() => send(item.msg)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Input Dock */}
        <div className="chat-dock-bar">
          <button
            type="button"
            className={`chat-mic-btn ${isRecording ? "recording" : ""}`}
            onClick={toggleMic}
            title={isRecording ? "Listening... click to stop" : "Speak your question"}
          >
            {isRecording ? "🔴" : "🎙️"}
          </button>

          <input
            type="text"
            className="chat-dock-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && send()}
            placeholder={t("chat_input_hint", "Ask anything about your Aloe vera plant...")}
            disabled={loading}
          />

          <button
            type="button"
            className="chat-send-btn"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            title="Send Message"
          >
            ➤
          </button>
        </div>
      </div>

      {/* Scientific Research Disclaimer */}
      <p className="chat-footer-disclaimer">
        ⚠️ {t(
          "chat_disclaimer",
          "AloeMithra AI delivers vetted horticultural research guidance. For large commercial outbreaks, consult local agricultural extension specialists."
        )}
      </p>
    </div>
  );
}
