import React, { useState, useRef, useEffect } from "react";
import { chatMessage, transcribeAudio } from "../api/client";
import { useApp } from "../context/AppContext";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

// ── Standard Web Audio API 16kHz PCM WAV Recorder ─────────────────────────
// Same recorder used in Chatbot.jsx — works in Chrome, Edge, Firefox, Safari
class AudioWavRecorder {
  constructor() {
    this.audioCtx = null;
    this.mediaStream = null;
    this.processor = null;
    this.buffers = [];
  }

  async start() {
    this.buffers = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
    });
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
    const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      this.buffers.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
  }

  async stop() {
    if (this.processor) {
      try { this.processor.disconnect(); } catch {}
      this.processor.onaudioprocess = null;
      this.processor = null;
    }
    if (this.mediaStream) {
      try { this.mediaStream.getTracks().forEach((t) => t.stop()); } catch {}
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try { await this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
    const totalLen = this.buffers.reduce((a, b) => a + b.length, 0);
    const merged = new Float32Array(totalLen);
    let off = 0;
    for (const b of this.buffers) { merged.set(b, off); off += b.length; }
    return this._encodeWav(merged, 16000);
  }

  _encodeWav(samples, sr) {
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buf);
    const w = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE");
    w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, samples.length * 2, true);
    let idx = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      idx += 2;
    }
    return new Blob([v], { type: "audio/wav" });
  }
}

// ── Voice chooser (matches Chatbot.jsx) ──────────────────────────────────
function findMatchingVoice(targetLang) {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const bcp47 = targetLang === "kn" ? "kn-in" : targetLang === "hi" ? "hi-in" : "en-us";
  const prefix = targetLang === "kn" ? "kn" : targetLang === "hi" ? "hi" : "en";
  const keyword = targetLang === "kn" ? "kannada" : targetLang === "hi" ? "hindi" : "english";
  return (
    voices.find((v) => v.lang?.toLowerCase() === bcp47) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(prefix)) ||
    voices.find((v) => v.name?.toLowerCase().includes(keyword)) ||
    (targetLang !== "en" ? voices.find((v) => v.lang?.toLowerCase() === "en-in") : null) ||
    voices.find((v) => v.default) ||
    voices[0] ||
    null
  );
}

export default function VoiceAssistant() {
  const { lang, t } = useApp();

  const [query, setQuery]         = useState("");
  const [response, setResp]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [isRecording, setRec]     = useState(false);
  const [isSpeaking, setSpeaking] = useState(false);
  const [micStatus, setMicStatus] = useState("");

  const recorderRef = useRef(null);
  const timeoutRef  = useRef(null);

  const langLabel = lang === "kn" ? "ಕನ್ನಡ" : lang === "hi" ? "हिन्दी" : "English";

  // Cancel speech / recording on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (recorderRef.current) recorderRef.current.stop().catch(() => {});
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Stop speaking when language changes
  useEffect(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [lang]);

  // ── Ask the AI assistant ──────────────────────────────────────────────
  const ask = async (qText) => {
    const text = (qText || query).trim();
    if (!text) return;
    setQuery(text);
    setLoading(true);
    setResp("");

    try {
      const { data } = await chatMessage(text, lang);
      const reply = (data.replies && data.replies[lang]) || data.reply || "";
      setResp(reply);
      // Auto-read the response aloud
      speakText(reply);
    } catch {
      toast.error(
        lang === "kn" ? "ಸರ್ವರ್ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ." :
        lang === "hi" ? "सर्वर से कनेक्ट नहीं हो सका।" :
        "Could not connect to the assistant server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── TTS Read Aloud ───────────────────────────────────────────────────
  const speakText = (rawText) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = rawText.replace(/[*#_~`>•\-]/g, " ").replace(/\s+/g, " ").trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const bcp47 = lang === "kn" ? "kn-IN" : lang === "hi" ? "hi-IN" : "en-US";
    utterance.lang = bcp47;
    utterance.rate = 0.92;
    const trySpeak = () => {
      const v = findMatchingVoice(lang);
      if (v) { utterance.voice = v; utterance.lang = v.lang || bcp47; }
      utterance.onstart = () => setSpeaking(true);
      utterance.onend   = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        trySpeak();
      };
    } else {
      trySpeak();
    }
  };

  // ── Stop & transcribe mic recording ─────────────────────────────────
  const stopAndTranscribe = async () => {
    if (!recorderRef.current) return;
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setRec(false);
    setMicStatus(
      lang === "kn" ? "⏳ ಧ್ವನಿ ಗುರುತಿಸಲಾಗುತ್ತಿದೆ..." :
      lang === "hi" ? "⏳ आवाज़ पहचानी जा रही है..." :
      "⏳ Transcribing speech..."
    );

    try {
      const wavBlob = await recorderRef.current.stop();
      recorderRef.current = null;

      if (!wavBlob || wavBlob.size < 1000) {
        setMicStatus("");
        toast(
          lang === "kn" ? "ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಮಾತನಾಡಿ." :
          lang === "hi" ? "कोई आवाज़ नहीं सुनाई दी। पुनः बोलें।" :
          "No speech detected. Please speak clearly into the mic.",
          { icon: "👂" }
        );
        return;
      }

      const { data } = await transcribeAudio(wavBlob, lang);
      setMicStatus("");
      if (data?.transcript?.trim()) {
        const spoken = data.transcript.trim();
        setQuery(spoken);
        toast.success(
          lang === "kn" ? `ಧ್ವನಿ: "${spoken}"` :
          lang === "hi" ? `आवाज़: "${spoken}"` :
          `Heard: "${spoken}"`
        );
        ask(spoken);
      } else {
        toast(
          lang === "kn" ? "ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ." :
          lang === "hi" ? "आवाज़ स्पष्ट नहीं थी। पुनः बोलें।" :
          "Could not understand the audio clearly. Please try again.",
          { icon: "👂" }
        );
      }
    } catch (err) {
      setMicStatus("");
      console.error("Transcription error:", err);
      toast.error(
        lang === "kn" ? "ಧ್ವನಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ದೋಷ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ." :
        lang === "hi" ? "आवाज़ प्रोसेस करने में त्रुटि। कृपया टाइप करें।" :
        "Error processing voice. Please type your question."
      );
    }
  };

  // ── Toggle mic on/off ────────────────────────────────────────────────
  const toggleMic = async () => {
    if (isRecording) {
      await stopAndTranscribe();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Microphone access is not supported in this browser.");
      return;
    }
    // Stop speech synthesis before recording
    if ("speechSynthesis" in window) { window.speechSynthesis.cancel(); setSpeaking(false); }

    try {
      const recorder = new AudioWavRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setRec(true);
      setMicStatus(
        lang === "kn" ? "🎙️ ಧ್ವನಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಮುಗಿದ ಮೇಲೆ ಮೈಕ್ ಒತ್ತಿ" :
        lang === "hi" ? "🎙️ आवाज़ सुन रहा हूँ... समाप्त करने के लिए माइक दबाएं" :
        "🎙️ Listening... Tap the button again when done"
      );
      // Auto-stop after 12 seconds
      timeoutRef.current = setTimeout(() => {
        if (recorderRef.current) stopAndTranscribe();
      }, 12000);
    } catch (err) {
      setRec(false);
      setMicStatus("");
      console.error("Mic error:", err);
      toast.error(
        lang === "kn" ? "ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅನುಮತಿಸಿ." :
        lang === "hi" ? "माइक्रोफ़ोन अनुमति अस्वीकृत। ब्राउज़र में माइक की अनुमति दें।" :
        "Microphone access denied. Please allow microphone permissions in your browser."
      );
    }
  };

  const QUICK_QUERIES = lang === "kn" ? [
    { label: "🍂 ತುಕ್ಕು ರೋಗ ಚಿಕಿತ್ಸೆ", query: "ಅಲೋ ರಸ್ಟ್ ರೋಗದ ಲಕ್ಷಣ ಮತ್ತು ಚಿಕಿತ್ಸೆ ತಿಳಿಸಿ." },
    { label: "☀️ ಸನ್‌ಬರ್ನ್ ಪರಿಹಾರ", query: "ಅಲೋ ಎಲೆಗಳು ಬಿಸಿಲಿನಿಂದ ಕೆಂಪಾಗಿದೆ. ಸರಿಪಡಿಸಿ." },
    { label: "🥀 ಆಂಥ್ರಾಕ್ನೋಸ್ ರೋಗ", query: "ಆಂಥ್ರಾಕ್ನೋಸ್ ಎಂದರೇನು? ಅಲೋ ಸಸ್ಯದಲ್ಲಿ ಹೇಗೆ ಚಿಕಿತ್ಸೆ ನೀಡುವುದು?" },
    { label: "💧 ನೀರಿನ ಸಮಯ", query: "ಅಲೋವೆರಾಗೆ ಎಷ್ಟು ದಿನಕ್ಕೊಮ್ಮೆ ನೀರು ಹಾಕಬೇಕು?" },
  ] : lang === "hi" ? [
    { label: "🍂 जंग रोग उपचार", query: "एलो रस्ट रोग के लक्षण और उपचार बताएं।" },
    { label: "☀️ सनबर्न ठीक करें", query: "एलोवेरा पत्ती धूप से लाल हो गई है। उपाय बताएं।" },
    { label: "🥀 एंथ्रेक्नोज़ क्या है?", query: "एलोवेरा में एंथ्रेक्नोज़ रोग का उपचार क्या है?" },
    { label: "💧 पानी देने का नियम", query: "एलोवेरा को कितने दिन में पानी देना चाहिए?" },
  ] : [
    { label: "🍂 How to treat rust?", query: "How do I treat aloe rust disease on my Aloe vera plant?" },
    { label: "☀️ Leaves turning red?", query: "My aloe vera leaves are turning red or brown from sun exposure. How do I fix it?" },
    { label: "🥀 What is anthracnose?", query: "What is anthracnose disease and how do I treat it on Aloe vera?" },
    { label: "💧 Watering schedule?", query: "What is the best watering schedule for healthy Aloe vera?" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>🎙️ {t("voice_title", "Voice Assistant")}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {t("voice_ask_prompt", "Tap the microphone, speak your question, and get instant plant guidance.")}
        </p>
      </div>

      {/* ── Big Mic Circle ── */}
      <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
        <button
          type="button"
          onClick={toggleMic}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          disabled={loading}
          style={{
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            width: 148,
            height: 148,
            borderRadius: "50%",
            background: isRecording
              ? "linear-gradient(135deg, #e53935 0%, #b71c1c 100%)"
              : "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
            color: "#ffffff",
            fontSize: "3.6rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isRecording
              ? "0 0 0 16px rgba(229,57,53,0.25), 0 0 0 32px rgba(229,57,53,0.1)"
              : "0 0 0 16px rgba(76,175,80,0.18), 0 0 0 32px rgba(76,175,80,0.08)",
            transition: "all 0.3s ease",
            transform: isRecording ? "scale(1.07)" : "scale(1)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {isRecording ? "🔴" : "🎙️"}
        </button>

        <h3 style={{
          color: isRecording ? "#c62828" : "var(--green-dark)",
          fontWeight: 800,
          marginTop: "1rem",
          marginBottom: "0.3rem",
          fontSize: "1.1rem",
        }}>
          {isRecording
            ? (lang === "kn" ? "ಆಲಿಸಲಾಗುತ್ತಿದೆ..." : lang === "hi" ? "सुन रहा हूँ..." : "Listening...")
            : t("voice_tap_speak", "Tap to Speak")}
        </h3>

        <p style={{ color: "var(--text-muted)", fontSize: "0.84rem", margin: 0, minHeight: "1.4em" }}>
          {micStatus || (isRecording
            ? (lang === "kn" ? "ಮಾತು ಮುಗಿದ ಮೇಲೆ ಮೈಕ್ ಒತ್ತಿ" :
               lang === "hi" ? "बात पूरी होने पर माइक दबाएं" :
               "Tap the button again when you finish speaking")
            : `${lang === "kn" ? "ಭಾಷೆ" : lang === "hi" ? "भाषा" : "Language"}: ${langLabel}`)}
        </p>
      </div>

      {/* ── Type or edit your question ── */}
      <div
        className="chat-dock-bar"
        style={{
          borderRadius: "var(--radius-pill)",
          border: "1.5px solid var(--accent-border)",
          marginTop: "0.5rem",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <input
          className="chat-dock-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && ask()}
          placeholder={
            lang === "kn" ? "ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮೈಕ್ ಒತ್ತಿ..." :
            lang === "hi" ? "यहाँ टाइप करें या माइक दबाएं..." :
            "Type here or tap the mic to speak..."
          }
          disabled={loading || isRecording}
          style={{ border: "none", background: "transparent" }}
        />
        <button
          className="chat-send-btn"
          onClick={() => ask()}
          disabled={loading || !query.trim() || isRecording}
          title="Send"
        >
          ➤
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && <div className="spinner" style={{ margin: "2rem auto" }} />}

      {/* ── AI Response Card ── */}
      {response && !loading && (
        <div
          className="card"
          style={{
            borderLeft: "5px solid var(--primary-mid)",
            marginTop: "1.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: 0.4, margin: 0 }}>
              🌿 {t("voice_response_label", "AI Plant Guidance")}
            </p>
            <button
              className="action-pill-btn"
              style={{ background: "var(--accent-soft)", padding: "5px 14px", borderRadius: 999 }}
              onClick={() => speakText(response)}
            >
              {isSpeaking ? "⏹️ Stop" : "🔊 Read Aloud"}
            </button>
          </div>
          <div style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "var(--text-main)" }}>
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── Quick Query Chips ── */}
      <div style={{ marginTop: "2rem" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          {t("voice_common_queries", "Quick Questions:")}
        </p>
        <div className="chat-chips-grid">
          {QUICK_QUERIES.map((q) => (
            <button
              key={q.label}
              className="chat-suggest-chip"
              onClick={() => ask(q.query)}
              disabled={loading || isRecording}
            >
              🗣️ {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mascot footer ── */}
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
            {lang === "kn"
              ? "\"ನಾನು ಸಿದ್ಧ — ಮಾತನಾಡಿ ♡\""
              : lang === "hi"
              ? "\"मैं तैयार हूँ — बोलिए ♡\""
              : "\"I'm ready — speak to me ♡\""}
          </p>
          <p style={{ color: "var(--text-mid)", fontSize: "0.82rem", margin: "2px 0 0 0" }}>
            {t("voice_companion_sub", "Your voice companion for healthy Aloe vera cultivation.")}
          </p>
        </div>
      </div>
    </div>
  );
}
