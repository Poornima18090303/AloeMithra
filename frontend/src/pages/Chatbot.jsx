import React, { useState, useRef, useEffect, useCallback } from "react";
import { chatMessage, transcribeAudio } from "../api/client";
import { useApp } from "../context/AppContext";
import { RobotMascotGraphic } from "../components/Illustrations";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

// Map app language code to BCP-47 speech locale
const LANG_TO_BCP47 = {
  en: "en-US",
  kn: "kn-IN",
  hi: "hi-IN",
};

// Clean markdown tags & review badges so text is clean for speech and display
function cleanTextForSpeech(text) {
  if (!text) return "";
  return text
    .replace(/[*#_~`>•\-]/g, " ")
    .replace(/\[NEEDS_NATIVE_REVIEW\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Convert Kannada script to Romanized phonetics for speech synthesis ONLY IF
// the user's OS completely lacks a native Kannada TTS voice (ensures voice is always audible)
function knToPhoneticRoman(text) {
  const vowels = {
    'ಅ':'a','ಆ':'aa','ಇ':'i','ಈ':'ee','ಉ':'u','ಊ':'oo','ಋ':'ru','ಎ':'e','ಏ':'ee','ಐ':'ai','ಒ':'o','ಓ':'oo','ಔ':'au','ಅಂ':'am','ಅಃ':'aha'
  };
  const cons = {
    'ಕ':'ka','ಖ':'kha','ಗ':'ga','ಘ':'gha','ಙ':'nga',
    'ಚ':'cha','ಛ':'chha','ಜ':'ja','ಝ':'jha','ಞ':'nya',
    'ಟ':'ta','ಠ':'tha','ಡ':'da','ಢ':'dha','ಣ':'na',
    'ತ':'ta','ಥ':'tha','ದ':'da','ಧ':'dha','ನ':'na',
    'ಪ':'pa','ಫ':'pha','ಬ':'ba','ಭ':'bha','ಮ':'ma',
    'ಯ':'ya','ರ':'ra','ಲ':'la','ವ':'va','ಶ':'sha','ಷ':'sha','ಸ':'sa','ಹ':'ha','ಳ':'la'
  };
  const matras = {
    'ಾ':'aa','ಿ':'i','ೀ':'ee','ು':'u','ೂ':'oo','ೃ':'ru','ೆ':'e','ೇ':'ee','ೈ':'ai','ೊ':'o','ೋ':'oo','ೌ':'au','ಂ':'m','ಃ':'h'
  };

  const res = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const c = text[i];
    if (vowels[c]) {
      res.push(vowels[c]);
    } else if (cons[c]) {
      const base = cons[c].slice(0, -1);
      if (i + 1 < n && text[i + 1] === '್') {
        res.push(base);
        i += 1;
      } else if (i + 1 < n && matras[text[i + 1]]) {
        res.push(base + matras[text[i + 1]]);
        i += 1;
      } else {
        res.push(cons[c]);
      }
    } else if (c === 'ಂ') {
      res.push('m');
    } else if (c === 'ಃ') {
      res.push('h');
    } else {
      res.push(c);
    }
    i += 1;
  }
  return res.join('');
}

// Find best matching voice in the browser for target language
function findMatchingVoice(targetLang) {
  if (!("speechSynthesis" in window)) return { voice: null, isNative: false };
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return { voice: null, isNative: false };

  const bcp47 = targetLang === "kn" ? "kn-in" : targetLang === "hi" ? "hi-in" : "en-us";
  const prefix = targetLang === "kn" ? "kn" : targetLang === "hi" ? "hi" : "en";
  const nameKeyword = targetLang === "kn" ? "kannada" : targetLang === "hi" ? "hindi" : "english";

  const norm = (str) => (str || "").toLowerCase().replace(/_/g, "-");

  // 1. Exact BCP-47 match
  let v = voices.find((item) => norm(item.lang) === bcp47);
  if (v) return { voice: v, isNative: true };

  // 2. Prefix match (e.g., 'kn', 'hi', 'en')
  v = voices.find((item) => norm(item.lang).startsWith(prefix));
  if (v) return { voice: v, isNative: true };

  // 3. Name keyword
  v = voices.find((item) => norm(item.name).includes(nameKeyword));
  if (v) return { voice: v, isNative: true };

  // 4. Indian English fallback (has native Indian phonetic cadence)
  if (targetLang === "kn" || targetLang === "hi") {
    v = voices.find((item) => norm(item.lang) === "en-in");
    if (v) return { voice: v, isNative: false };
  }

  // 5. Default voice
  v = voices.find((item) => item.default) || voices[0] || null;
  return { voice: v, isNative: false };
}

// Safely play speech utterance, preventing Chromium GC and synchronous cancellation bugs
function playUtteranceSafe(utterance) {
  if (!("speechSynthesis" in window)) return;

  // Keep a global reference to prevent Chromium garbage collection bug
  window._amActiveUtterance = utterance;

  // Unpause engine if in stuck state
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {}

  // Cancel prior speech, then queue with a tiny tick so Chromium pipeline resets cleanly
  try {
    window.speechSynthesis.cancel();
  } catch {}

  setTimeout(() => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech playback error:", err);
    }
  }, 45);
}

// Standard Web Audio API 16kHz PCM WAV Recorder
// Guarantees voice capture in EVERY browser (Chrome, Edge, Firefox, Brave, Safari, WebViews)
class AudioWavRecorder {
  constructor() {
    this.audioCtx = null;
    this.mediaStream = null;
    this.processor = null;
    this.buffers = [];
    this.sampleRate = 16000;
  }

  async start() {
    this.buffers = [];
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass({ sampleRate: 16000 });
    const source = this.audioCtx.createMediaStreamSource(this.mediaStream);

    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0);
      this.buffers.push(new Float32Array(data));
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
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try { await this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }

    const totalLen = this.buffers.reduce((acc, b) => acc + b.length, 0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const b of this.buffers) {
      merged.set(b, offset);
      offset += b.length;
    }

    return this.encodeWavBlob(merged, 16000);
  }

  encodeWavBlob(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeStr = (v, off, str) => {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(off + i, str.charCodeAt(i));
      }
    };

    writeStr(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(view, 8, "WAVE");

    writeStr(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeStr(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    let idx = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      idx += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  }
}

export default function Chatbot() {
  const { user, lang, t } = useApp();

  // Authentic welcome message in each language
  const getWelcomeContent = useCallback((targetLang) => {
    const l = targetLang || lang;
    if (l === "kn") {
      return (
        "ನಮಸ್ಕಾರ! ನಾನು **ಅಲೋಮಿತ್ರ AI** 🌱\n\n" +
        "ಅಲೋವೆರಾ ಸಸ್ಯದ ಆರೋಗ್ಯಕ್ಕಾಗಿ ನಾನು ನಿಮ್ಮ ವಿಶೇಷ ಕೃಷಿ ಸಹಾಯಕ. ಇಂದು ನಿಮ್ಮ ಸಸ್ಯಗಳ ಬಗ್ಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?\n\n" +
        "**ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದಾದ ಸಾಮಾನ್ಯ ವಿಷಯಗಳು:**\n" +
        "- 🍂 **ಅಲೋ ರಸ್ಟ್ (ತುಕ್ಕು ರೋಗ)** (ಕೆಂಪು/ಕಂದು ಬಣ್ಣದ ಗುಳ್ಳೆಗಳು)\n" +
        "- 🥀 **ಆಂಥ್ರಾಕ್ನೋಸ್** (ಕಪ್ಪು ತಗ್ಗು ಕಲೆಗಳು)\n" +
        "- 🍃 **ಎಲೆ ಚುಕ್ಕೆ ರೋಗ** (ಶಿಲೀಂಧ್ರ ಕಲೆಗಳು)\n" +
        "- ☀️ **ಸನ್‌ಬರ್ನ್ (ಬಿಸಿಲು ಗಾಯ)** (ಬಿಸಿಲು ಹಾನಿ — *ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಬೇಡಿ!*)\n" +
        "- 💧 **ನೀರುಣಿಸುವಿಕೆ ಮತ್ತು ಮಣ್ಣು** (ಉತ್ತಮ ನೀರು ಬಸಿದುಹೋಗುವಿಕೆ & ಆರೈಕೆ)"
      );
    }
    if (l === "hi") {
      return (
        "नमस्ते! मैं **एलोमित्रा AI** हूँ 🌱\n\n" +
        "मैं एलोवेरा पौधों के स्वास्थ्य के लिए आपका समर्पित कृषि सहायक हूँ। आज मैं आपके पौधों की क्या मदद कर सकता हूँ?\n\n" +
        "**सामान्य विषय जिनके बारे में आप पूछ सकते हैं:**\n" +
        "- 🍂 **एलो रस्ट (गेरुआ रोग)** (लाल/भूरे दानेदार उभार)\n" +
        "- 🥀 **एंथ्रेक्नोज़** (काले धब्बे)\n" +
        "- 🍃 **पत्ती का धब्बा रोग** (फफूंद या जीवाणु के धब्बे)\n" +
        "- ☀️ **सनबर्न (झुलसना)** (अत्यधिक धूप का तनाव — *फफूंदनाशक का उपयोग न करें!*)\n" +
        "- 💧 **पानी और मिट्टी** (उचित जल निकासी और मौसमी देखभाल)"
      );
    }
    return t(
      "chat_welcome_msg",
      "Hello! I am **AloeMithra AI** 🌱\n\n" +
      "I am your specialized agronomist for Aloe vera health. How can I assist your plants today?\n\n" +
      "**Common topics you can ask me:**\n" +
      "- 🍂 **Aloe Rust** (Reddish/brown raised pustules)\n" +
      "- 🥀 **Anthracnose** (Dark sunken spots with water-soaked margins)\n" +
      "- 🍃 **Leaf Spot** (Fungal/bacterial circular lesions)\n" +
      "- ☀️ **Sunburn** (UV scorch & environmental stress — *No fungicides!*)\n" +
      "- 💧 **Watering & Soil** (Proper drainage & seasonal care)"
    );
  }, [lang, t]);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      isWelcome: true,
      content: getWelcomeContent(lang),
      replies: {
        en: getWelcomeContent("en"),
        kn: getWelcomeContent("kn"),
        hi: getWelcomeContent("hi"),
      },
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");

  const bottomRef = useRef(null);
  const wavRecorderRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const speakingIdxRef = useRef(null);
  speakingIdxRef.current = speakingIdx;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (wavRecorderRef.current) {
        wavRecorderRef.current.stop().catch(() => {});
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  // Text-to-Speech (Read Aloud)
  const speakMessage = useCallback(
    (text, idx, forcedLang) => {
      if (!("speechSynthesis" in window)) {
        toast.error("Text-to-speech not supported in this browser.");
        return;
      }

      const activeLang = forcedLang || lang;

      // If clicked on active message without forcedLang, stop it
      if (speakingIdx === idx && !forcedLang) {
        window.speechSynthesis.cancel();
        setSpeakingIdx(null);
        return;
      }

      window.speechSynthesis.cancel();

      let textToSpeak = cleanTextForSpeech(text);
      if (!textToSpeak) return;

      const { voice, isNative } = findMatchingVoice(activeLang);

      // If speaking Kannada and Windows has no Kannada voice pack installed,
      // use clear phonetic syllables so Indian English voice speaks audibly
      if (activeLang === "kn" && !isNative) {
        textToSpeak = knToPhoneticRoman(textToSpeak);
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const bcp47 = LANG_TO_BCP47[activeLang] || "en-US";
      utterance.lang = bcp47;
      utterance.rate = 0.92;

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || bcp47;
      }

      utterance.onstart = () => setSpeakingIdx(idx);
      utterance.onend = () => setSpeakingIdx(null);
      utterance.onerror = (e) => {
        setSpeakingIdx(null);
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("Speech playback:", e.error);
        }
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          const v = findMatchingVoice(activeLang);
          if (v.voice) utterance.voice = v.voice;
          window.speechSynthesis.speak(utterance);
        };
      } else {
        window.speechSynthesis.speak(utterance);
      }
    },
    [lang, speakingIdx]
  );

  // CRITICAL REQUIREMENT:
  // When language changes from settings / navbar dropdown:
  // 1. Immediately update EVERY message in the chat feed to the newly selected language.
  // 2. If a message is currently playing via "Read Aloud", switch voice and continue reading in the new language!
  useEffect(() => {
    const currentlySpeaking = speakingIdxRef.current;

    // Stop previous voice
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Immediately translate every message in the chat history
    setMessages((prev) =>
      prev.map((m) => {
        if (m.role === "bot") {
          if (m.isWelcome) {
            return {
              ...m,
              content: getWelcomeContent(lang),
            };
          }
          if (m.replies && m.replies[lang]) {
            return {
              ...m,
              content: m.replies[lang],
            };
          }
        }
        return m;
      })
    );

    // If it was reading aloud, immediately resume reading in the newly selected language!
    if (currentlySpeaking !== null) {
      setSpeakingIdx(null);
      const timer = setTimeout(() => {
        setMessages((latest) => {
          const targetMsg = latest[currentlySpeaking];
          if (targetMsg) {
            const newText = targetMsg.isWelcome
              ? getWelcomeContent(lang)
              : (targetMsg.replies && targetMsg.replies[lang]) || targetMsg.content;
            speakMessage(newText, currentlySpeaking, lang);
          }
          return latest;
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lang, getWelcomeContent, speakMessage]);

  // Copy message text
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t("chat_copied_toast", "Copied to clipboard!"));
  };

  // Send message to the botanical AI backend
  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg, time: timeStr }]);
    setLoading(true);

    try {
      const { data } = await chatMessage(msg, lang);
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          originalQuery: msg,
          content: data.reply,
          replies: data.replies || { [lang]: data.reply },
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      toast.error(
        lang === "kn"
          ? "ಸಸ್ಯ ಆರೋಗ್ಯ ಸರ್ವರ್ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ."
          : lang === "hi"
          ? "पादप स्वास्थ्य सर्वर से कनेक्ट नहीं हो सका।"
          : "Could not connect to the botanical AI server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Stop recording and transcribe the captured voice
  const stopAndTranscribeAudio = async () => {
    if (!wavRecorderRef.current) return;
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    setIsRecording(false);
    setRecordingStatus(
      lang === "kn"
        ? "⏳ ಧ್ವನಿ ಗುರುತಿಸಲಾಗುತ್ತಿದೆ..."
        : lang === "hi"
        ? "⏳ आवाज़ पहचानी जा रही है..."
        : "⏳ Transcribing speech..."
    );

    try {
      const wavBlob = await wavRecorderRef.current.stop();
      wavRecorderRef.current = null;

      if (!wavBlob || wavBlob.size < 1000) {
        setRecordingStatus("");
        toast(
          lang === "kn"
            ? "ಯಾವುದೇ ಧ್ವನಿ ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಮಾತನಾಡಿ."
            : lang === "hi"
            ? "कोई आवाज़ नहीं सुनाई दी। पुनः बोलें।"
            : "No speech detected. Please speak clearly into the mic.",
          { icon: "👂" }
        );
        return;
      }

      // Send recorded audio to backend speech recognition endpoint
      const { data } = await transcribeAudio(wavBlob, lang);

      setRecordingStatus("");
      if (data && data.transcript && data.transcript.trim()) {
        const spokenQuestion = data.transcript.trim();
        setInput(spokenQuestion);
        toast.success(
          lang === "kn"
            ? `ಧ್ವನಿ ಗ್ರಹಿಸಲಾಗಿದೆ: "${spokenQuestion}"`
            : lang === "hi"
            ? `आवाज़ प्राप्त हुई: "${spokenQuestion}"`
            : `Heard: "${spokenQuestion}"`
        );
        send(spokenQuestion);
      } else {
        toast(
          lang === "kn"
            ? "ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ."
            : lang === "hi"
            ? "आवाज़ स्पष्ट नहीं थी। कृपया पुनः बोलें।"
            : "Could not clearly understand the audio. Please try again.",
          { icon: "👂" }
        );
      }
    } catch (err) {
      setRecordingStatus("");
      console.error("Transcription error:", err);
      toast.error(
        lang === "kn"
          ? "ಧ್ವನಿ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುವಲ್ಲಿ ದೋಷವಾಗಿದೆ. ದಯವಿಟ್ಟು ಟೈಪ್ ಮಾಡಿ."
          : lang === "hi"
          ? "आवाज़ प्रोसेस करने में त्रुटि। कृपया टाइप करें।"
          : "Error processing voice audio. Please try typing."
      );
    }
  };

  // Toggle Microphone: High-Fidelity Audio Capture
  const toggleMic = async () => {
    // If currently recording, stop and process the voice!
    if (isRecording) {
      await stopAndTranscribeAudio();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const recorder = new AudioWavRecorder();
      await recorder.start();
      wavRecorderRef.current = recorder;
      setIsRecording(true);

      setRecordingStatus(
        lang === "kn"
          ? "🎙️ ಧ್ವನಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಮುಗಿದ ಮೇಲೆ ಮೈಕ್ ಒತ್ತಿ"
          : lang === "hi"
          ? "🎙️ आवाज़ सुन रहा हूँ... समाप्त करने के लिए माइक दबाएं"
          : "🎙️ Listening... Click mic when done"
      );

      // Auto-stop after 10 seconds of speech if user doesn't press stop
      recordingTimeoutRef.current = setTimeout(() => {
        if (wavRecorderRef.current) {
          stopAndTranscribeAudio();
        }
      }, 10000);
    } catch (err) {
      setIsRecording(false);
      setRecordingStatus("");
      console.error("Mic start error:", err);
      toast.error(
        lang === "kn"
          ? "ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ URL ಬಾರ್‌ನಲ್ಲಿ ಮೈಕ್ ಅನುಮತಿಸಿ."
          : lang === "hi"
          ? "माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया ब्राउज़र में माइक की अनुमति दें।"
          : "Microphone access denied. Please allow microphone access in your browser."
      );
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
        isWelcome: true,
        content: getWelcomeContent(lang),
        replies: {
          en: getWelcomeContent("en"),
          kn: getWelcomeContent("kn"),
          hi: getWelcomeContent("hi"),
        },
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.success(t("chat_clear_btn", "Chat cleared"));
  };

  // Localized quick discussion topics
  const getQuickTopics = () => {
    if (lang === "kn") {
      return [
        {
          label: "🍂 ತುಕ್ಕು ರೋಗದ ಲಕ್ಷಣ ಮತ್ತು ಪರಿಹಾರ",
          msg: "ಅಲೋ ರಸ್ಟ್ (ತುಕ್ಕು ರೋಗ) ಲಕ್ಷಣಗಳು ಮತ್ತು ಸಾವಯವ ಚಿಕಿತ್ಸೆ ತಿಳಿಸಿ.",
        },
        {
          label: "☀️ ಸನ್‌ಬರ್ನ್ (ಬಿಸಿಲು ಗಾಯ) ಸರಿಪಡಿಸುವುದು",
          msg: "ಅಲೋವೆರಾ ಎಲೆ ಬಿಸಿಲಿನಿಂದ ಕೆಂಪು ಕಂದು ಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದೆ. ಸನ್‌ಬರ್ನ್ ಪರಿಹಾರ ತಿಳಿಸಿ.",
        },
        {
          label: "💧 ನೀರುಣಿಸುವ ವೇಳಾಪಟ್ಟಿ",
          msg: "ಅಲೋವೆರಾಗೆ ಎಷ್ಟು ದಿನಕ್ಕೊಮ್ಮೆ ನೀರು ಹಾಕಬೇಕು ಮತ್ತು ಬೇರು ಕೊಳೆಯುವುದನ್ನು ತಡೆಯುವುದು ಹೇಗೆ?",
        },
        {
          label: "🥀 ಆಂಥ್ರಾಕ್ನೋಸ್ ರೋಗ ನಿಯಂತ್ರಣ",
          msg: "ಆಂಥ್ರಾಕ್ನೋಸ್ ರೋಗದ ಕಪ್ಪು ಕಲೆಗಳು ಬಂದರೆ ಯಾವ ಕ್ರಮ ಕೈಗೊಳ್ಳಬೇಕು?",
        },
        {
          label: "🪴 ಉತ್ತಮ ಮಣ್ಣು ಮತ್ತು ಕುಂಡ",
          msg: "ಅಲೋವೆರಾ ಸಸ್ಯಕ್ಕೆ ಸೂಕ್ತವಾದ ಮಣ್ಣು ಮತ್ತು ಕುಂಡದ ವಿನ್ಯಾಸ ಯಾವುದು?",
        },
      ];
    }
    if (lang === "hi") {
      return [
        {
          label: "🍂 एलो रस्ट (जंग रोग) के लक्षण व उपचार",
          msg: "एलो रस्ट (जंग रोग) के लक्षण और जैविक उपचार बताएं।",
        },
        {
          label: "☀️ सनबर्न (धूप से नुकसान) ठीक करें",
          msg: "एलोवेरा पत्ती धूप से लाल या भूरी हो गई है। सनबर्न ठीक करने के उपाय बताएं।",
        },
        {
          label: "💧 पानी देने का सही नियम",
          msg: "एलोवेरा में कितने दिन बाद पानी देना चाहिए और जड़ सड़ने से कैसे बचाएं?",
        },
        {
          label: "🥀 एंथ्रेक्नोज़ रोग प्रबंधन",
          msg: "एलोवेरा में एंथ्रेक्नोज़ के काले धब्बे दिखने पर क्या उपचार करें?",
        },
        {
          label: "🪴 सही मिट्टी और गमले की पसंद",
          msg: "एलोवेरा के लिए सबसे अच्छी जल-निकासी मिट्टी और गमला कौन सा है?",
        },
      ];
    }
    return [
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
  };

  const quickTopics = getQuickTopics();
  const currentLangLabel = lang === "kn" ? "ಕನ್ನಡ" : lang === "hi" ? "हिन्दी" : "English";

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
                      className={`action-pill-btn ${speakingIdx === idx ? "active-speech" : ""}`}
                      onClick={() => speakMessage(m.content, idx)}
                      style={
                        speakingIdx === idx
                          ? { background: "#10b981", color: "#ffffff", borderColor: "#059669" }
                          : {}
                      }
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
            {quickTopics.map((item, idx) => (
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
            title={
              isRecording
                ? `Recording voice in ${currentLangLabel}... Click to stop and send`
                : `Click to speak in ${currentLangLabel}`
            }
          >
            {isRecording ? "🔴" : "🎙️"}
          </button>

          <input
            type="text"
            className="chat-dock-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && send()}
            placeholder={
              recordingStatus ||
              t("chat_input_hint", "Ask anything about your Aloe vera plant...")
            }
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
