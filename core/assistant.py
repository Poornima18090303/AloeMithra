"""
AloeMithra Plant Assistant & Knowledge Base Response Engine.
Powers the conversational chatbot and voice assistant using research-safe rules.

Supports:
  - English (typo-tolerant fuzzy matching)
  - Kannada (ಕನ್ನಡ)
  - Hindi (हिन्दी)
"""

from __future__ import annotations
import re
from difflib import SequenceMatcher


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize(text: str) -> str:
    """Lowercase, strip punctuation (ASCII only), collapse whitespace.
    Uses re.UNICODE-safe replacement so Kannada/Hindi characters are preserved."""
    text = text.lower()
    # Remove ASCII punctuation only — keep Unicode letters/digits intact
    text = re.sub(r"[!\"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _fuzzy_in(word: str, text: str, threshold: float = 0.72) -> bool:
    """Return True if `word` appears in `text` with >= threshold similarity to any token."""
    tokens = text.split()
    for token in tokens:
        if SequenceMatcher(None, word, token).ratio() >= threshold:
            return True
    return False


def _any_keyword(keywords: list[str], msg: str) -> bool:
    """
    Check if any keyword from the list appears in msg.
    Handles:
      - exact substring match (fast path)
      - fuzzy match for single English words (handles typos)
      - Unicode substring match for Kannada / Hindi phrases
    """
    for kw in keywords:
        # For short non-ASCII phrases (Kannada/Hindi) use exact substring
        if any(ord(c) > 127 for c in kw):
            if kw in msg:
                return True
        else:
            # Exact substring match first
            if kw in msg:
                return True
            # Fuzzy match only for single words (avoid fuzzy on long phrases)
            if " " not in kw and len(kw) >= 4:
                if _fuzzy_in(kw, msg):
                    return True
    return False


# ---------------------------------------------------------------------------
# Keyword Banks
# ---------------------------------------------------------------------------

# ── Aloe Rust ──────────────────────────────────────────────────────────────
RUST_KW = [
    # English
    "rust", "aloe rust", "orange spot", "brown pustule", "pustule", "rusty",
    "reddish spot", "raised spot", "fungal spot", "rust disease", "rust infection",
    "aloe rest",        # common typo
    "alo rust", "rust treatment", "rust cure", "rust symptom",
    "rust on leaf", "rust on aloe",
    # Kannada script
    "ತುಕ್ಕು", "ತುಕ್ಕು ರೋಗ", "ಆಲೋ ತುಕ್ಕು", "ಕಿತ್ತಳೆ ಚುಕ್ಕೆ",
    "ಕಂದು ಗುಳ್ಳೆ", "ಶಿಲೀಂಧ್ರ ರೋಗ",
    # Romanized Kannada
    "tukku", "tukku roga", "thukku", "thukku roga", "kendale",
    # Hindi script & Romanized
    "जंग", "रतुआ", "एलो रस्ट", "नारंगी धब्बे", "भूरे उभार", "फंगल धब्बे",
    "पत्ती पर जंग", "जंग रोग", "jang", "jung", "ratua", "gerua",
]

# ── Anthracnose ────────────────────────────────────────────────────────────
ANTHR_KW = [
    # English
    "anthracnose", "sunken spot", "black spot", "water soaked", "water-soaked",
    "dark lesion", "oval spot", "anthracnos", "anthrcnose", "antracnose",
    "dark spot", "wet spot", "rotting spot", "leaf rot", "anthracnose cure",
    "anthracnose treatment", "anthracnose symptom",
    # Kannada script
    "ಆಂಥ್ರಾಕ್ನೋಸ್", "ಕಪ್ಪು ಚುಕ್ಕೆ", "ಮುಳುಗಿದ ಚುಕ್ಕೆ", "ನೀರಿನ ಕಲೆ",
    "ತೇವ ಕಲೆ", "ಕಪ್ಪು ಕಲೆ ರೋಗ",
    # Romanized Kannada
    "anthracnose", "kappu chukke", "neerina kale", "anthrac",
    # Hindi script & Romanized
    "एन्थ्रेकनोज", "काला धब्बा", "धंसे धब्बे", "पानी भरे धब्बे",
    "गहरे घाव", "काले धब्बे", "kala dhabba", "anthracnose",
]

# ── Leaf Spot ──────────────────────────────────────────────────────────────
LEAFSPOT_KW = [
    # English
    "leaf spot", "leafspot", "brown spot", "circular spot", "spots on leaf",
    "yellow halo", "irregular spot", "spotted leaf", "spot disease",
    "leaf spot treatment", "leaf spot cure", "leaf spotting",
    # Kannada script
    "ಎಲೆ ಚುಕ್ಕೆ", "ಎಲೆ ಮೇಲೆ ಚುಕ್ಕೆ", "ಬ್ರೌನ್ ಚುಕ್ಕೆ", "ಗೋಲಾಕಾರ ಚುಕ್ಕೆ",
    "ಹಳದಿ ಹಾಲೊ", "ಚುಕ್ಕೆ ರೋಗ",
    # Romanized Kannada
    "ele chukke", "ele mele chukke", "chukke roga", "leaf spot",
    # Hindi script & Romanized
    "पत्ती धब्बा", "पत्ते पर धब्बा", "भूरे गोल धब्बे", "पीला घेरा",
    "धब्बे रोग", "लीफ स्पॉट", "patti dhabba", "patte par dhabba",
]

# ── Sunburn ────────────────────────────────────────────────────────────────
SUNBURN_KW = [
    # English
    "sunburn", "sun burn", "sun damage", "uv damage", "solar", "bleached leaf",
    "bronze leaf", "red leaf", "brown tip", "white patch", "scorched", "burnt leaf",
    "sunscorch", "sun scorch", "too much sun", "sun stress", "light burn",
    "heat damage", "heat stress", "sunburn treatment", "sunburn cure",
    # Kannada script
    "ಸೂರ್ಯ ಬೆಂಕಿ", "ಸನ್‌ಬರ್ನ್", "ಬಿಸಿಲು ಹಾನಿ", "ಎಲೆ ಸುಡುವಿಕೆ",
    "ಕೆಂಪು ಎಲೆ", "ಬೆಳ್ಳನೆ ಎಲೆ", "ಶಾಖ ಒತ್ತಡ",
    # Romanized Kannada
    "sunburn", "bisilu", "bisilu hani", "soorya benki", "sun burn",
    # Hindi script & Romanized
    "धूप से जलन", "सनबर्न", "धूप की क्षति", "झुलसी पत्ती", "लाल पत्ती",
    "सफेद धब्बा", "गर्मी से नुकसान", "यूवी नुकसान", "dhoop se jalan", "sunburn",
]

# ── Healthy / General Care ─────────────────────────────────────────────────
HEALTHY_KW = [
    # English
    "healthy", "normal", "water", "watering", "soil", "pot", "fertilize",
    "fertiliser", "fertilizer", "care", "grow", "light", "sunlight",
    "repot", "drainage", "how to grow", "how to care", "aloe care",
    "general care", "prevent disease", "prevention", "maintenance",
    "healthy aloe", "keep healthy", "potting mix",
    # Kannada script
    "ಆರೋಗ್ಯಕರ", "ನೀರು ಹಾಕುವುದು", "ಮಣ್ಣು", "ಬೆಳಕು", "ಗೊಬ್ಬರ",
    "ಆಲೋ ವೇರಾ ಆರೈಕೆ", "ತಡೆಗಟ್ಟುವಿಕೆ", "ನಿರ್ವಹಣೆ",
    # Romanized Kannada
    "aarogya", "aarogyakara", "neeru", "mannu", "belaku", "gobbera", "aaraike",
    # Hindi script & Romanized
    "स्वस्थ", "पानी देना", "मिट्टी", "रोशनी", "खाद", "देखभाल",
    "एलो वेरा की देखभाल", "रोकथाम", "रखरखाव", "paani", "mitti", "dekhbhal",
]

# ── Greeting ───────────────────────────────────────────────────────────────
GREET_KW = [
    # English
    "hello", "hi", "hey", "good morning", "good evening", "howdy", "help",
    "start", "begin", "what can you do", "what do you know",
    # Kannada script & Romanized
    "ನಮಸ್ಕಾರ", "ಹಲೋ", "ಹಾಯ್", "ನಿಮಗೆ ನಮಸ್ಕಾರ", "namaskara", "namaskaram",
    # Hindi script & Romanized
    "नमस्ते", "हेलो", "हाय", "मदद", "शुरू", "namaste", "pranam",
]

# ── Symptoms question (generic) ─────────────────────────────────────────────
SYMPTOM_KW = [
    "symptom", "sign", "look like", "how does", "identify", "what is", "detect",
    "recognize", "लक्षण", "ಲಕ್ಷಣ",
]

# ── Treatment / Cure question (generic) ────────────────────────────────────
TREATMENT_KW = [
    "treat", "cure", "fix", "remedy", "control", "manage", "solve", "help",
    "how to", "solution", "medicine", "spray", "prevent",
    "ಚಿಕಿತ್ಸೆ", "ನಿರ್ವಹಣೆ", "ನಿಯಂತ್ರಣ",
    "उपचार", "इलाज", "नियंत्रण", "समाधान",
]


# ---------------------------------------------------------------------------
# Response Builders
# ---------------------------------------------------------------------------

def _rust_reply() -> str:
    return (
        "🍂 **Aloe Rust (Fungal Infection)**\n\n"
        "**🔎 Symptoms:**\n"
        "• Small yellow or pale spots that turn into raised dark-brown or black pustules on leaf surfaces.\n"
        "• Pustules may release orange/rust-coloured powdery spores when touched.\n\n"
        "**🛠️ Management:**\n"
        "• **Sanitation:** Prune severely infected leaves with sterilised shears (clean with 70% alcohol).\n"
        "• **Cultural Care:** Keep foliage completely dry — water only at the soil base.\n"
        "• **Spacing:** Ensure wide spacing between plants for strong airflow.\n"
        "• **Avoid overhead irrigation** — moisture spreads rust spores rapidly.\n\n"
        "⚠️ *All knowledge base entries are DRAFT — consult an agricultural expert for final decisions.*"
    )

def _anthracnose_reply() -> str:
    return (
        "🥀 **Anthracnose (Fungal Lesions)**\n\n"
        "**🔎 Symptoms:**\n"
        "• Sunken, round or oval, water-soaked dark lesions that expand and soften leaf tissue.\n"
        "• Lesions may have pinkish or orange spore masses in humid conditions.\n\n"
        "**🛠️ Management:**\n"
        "• **Sanitation:** Remove badly affected leaves and dispose (do NOT compost diseased foliage).\n"
        "• **Cultural Care:** Reduce ambient humidity, improve ventilation.\n"
        "• **Watering:** Water only when the potting mix is fully dry.\n"
        "• **Sterilise tools** between cuts to avoid spreading.\n\n"
        "⚠️ *All knowledge base entries are DRAFT — consult an agricultural expert for final decisions.*"
    )

def _leafspot_reply() -> str:
    return (
        "🍃 **Leaf Spot Condition**\n\n"
        "**🔎 Symptoms:**\n"
        "• Circular or irregular brown/black spots scattered across leaf blades.\n"
        "• Spots may have yellow halos and can merge into larger dead areas.\n\n"
        "**🛠️ Management:**\n"
        "• **Sanitation:** Prune heavily spotted leaves and disinfect tools after every cut.\n"
        "• **Cultural Care:** Keep leaves completely dry during irrigation.\n"
        "• **Environment:** Reduce humidity and ensure good air circulation.\n\n"
        "⚠️ *All knowledge base entries are DRAFT — consult an agricultural expert for final decisions.*"
    )

def _sunburn_reply() -> str:
    return (
        "☀️ **Sunburn (Abiotic UV Damage — NOT a disease!)**\n\n"
        "**🔎 Symptoms:**\n"
        "• Reddish, bronze, or bleached dry patches on sun-exposed upper leaf surfaces.\n"
        "• Affected areas feel dry and papery — no spores or wet ooze.\n\n"
        "**🛠️ Management:**\n"
        "• **⛔ NEVER use fungicides!** Sunburn is UV/heat injury, not an infection. Fungicides will cause more damage.\n"
        "• **Shade:** Move plant to bright *indirect* light or use a 30–50% shade cloth during midday (11 AM – 4 PM).\n"
        "• **Gradual exposure:** Acclimate plants slowly if moving from indoors to full sun.\n\n"
        "⚠️ *All knowledge base entries are DRAFT — consult an agricultural expert for final decisions.*"
    )

def _healthy_reply() -> str:
    return (
        "🌱 **Healthy Aloe Vera — Preventive Care Guide**\n\n"
        "**💧 Watering:**\n"
        "• Soak-and-dry method: water deeply, then wait until the top 2 inches of soil are completely dry.\n"
        "• Never let the pot sit in standing water (causes root rot).\n\n"
        "**☀️ Light:**\n"
        "• Bright indirect sunlight for 6–8 hours daily.\n"
        "• Avoid harsh direct midday sun — causes sunburn.\n\n"
        "**🪴 Soil & Pot:**\n"
        "• Use gritty cactus/succulent potting mix with perlite or coarse sand.\n"
        "• Always use containers with drainage holes.\n\n"
        "**🧹 Sanitation:**\n"
        "• Remove naturally dried lower leaves periodically.\n"
        "• Sterilise cutting tools before use.\n\n"
        "✅ *No chemical treatments required for healthy plants.*"
    )

def _greeting_reply() -> str:
    return (
        "Hello! 👋 I'm **AloeMithra**, your intelligent Aloe vera health companion!\n\n"
        "I can answer questions about:\n"
        "1. 🍂 **Aloe Rust** — pustules & prevention\n"
        "2. 🥀 **Anthracnose** — dark sunken lesions\n"
        "3. 🍃 **Leaf Spot** — brown/black spots on leaves\n"
        "4. ☀️ **Sunburn** — UV damage & shade care\n"
        "5. 🌱 **General Care** — watering, soil, light & prevention\n\n"
        "You can ask in **English**, **ಕನ್ನಡ (Kannada)**, or **हिन्दी (Hindi)**!\n\n"
        "👉 Try: *'What are the symptoms of Anthracnose?'* or *'ತುಕ್ಕು ರೋಗ ಏನು?'* or *'सनबर्न का इलाज?'*"
    )

def _fallback_reply(original_msg: str) -> str:
    return (
        f"🌿 I understood your question, but I could not find a specific match for: **\"{original_msg[:80]}\"**\n\n"
        "I specialise in Aloe vera plant health. Try asking about:\n"
        "• 🍂 Aloe Rust (*ತುಕ್ಕು ರೋಗ / जंग रोग*)\n"
        "• 🥀 Anthracnose (*ಆಂಥ್ರಾಕ್ನೋಸ್ / एन्थ्रेकनोज*)\n"
        "• 🍃 Leaf Spot (*ಎಲೆ ಚುಕ್ಕೆ / पत्ती धब्बा*)\n"
        "• ☀️ Sunburn (*ಸನ್‌ಬರ್ನ್ / सनबर्न*)\n"
        "• 🌱 General Care (*ಆರೈಕೆ / देखभाल*)\n\n"
        "You can ask in **English, Kannada, or Hindi**."
    )


# ---------------------------------------------------------------------------
# Language-aware Response Builders (Kannada & Hindi)
# ---------------------------------------------------------------------------

def _rust_reply_kn() -> str:
    return (
        "🍂 **ತುಕ್ಕು ರೋಗ (Aloe Rust - ಶಿಲೀಂಧ್ರ ಸೋಂಕು)**\n\n"
        "**🔎 ಲಕ್ಷಣಗಳು:**\n"
        "• ಎಲೆಯ ಮೇಲ್ಮೈನಲ್ಲಿ ಸಣ್ಣ ಹಳದಿ ಅಥವಾ ತಿಳಿ ಚುಕ್ಕೆಗಳು ಕಾಣಿಸುತ್ತವೆ.\n"
        "• ನಂತರ ಅವು ಕಿತ್ತಳೆ / ತಿಳಿಗಂದು ಬಣ್ಣದ ಎತ್ತರವಾದ ಗುಳ್ಳೆಗಳಾಗಿ ಮಾರ್ಪಡುತ್ತವೆ.\n"
        "• ಮುಟ್ಟಿದಾಗ ತುಕ್ಕು-ಬಣ್ಣದ ಪುಡಿ ಬರಬಹುದು.\n\n"
        "**🛠️ ನಿರ್ವಹಣೆ:**\n"
        "• **ಸ್ವಚ್ಛತೆ:** ತೀವ್ರವಾಗಿ ಸೋಂಕಿತ ಎಲೆಗಳನ್ನು ಶುದ್ಧೀಕರಿಸಿದ ಕತ್ತರಿಯಿಂದ ಕತ್ತರಿಸಿ ತೆಗೆಯಿರಿ.\n"
        "• ನೀರನ್ನು ನೇರವಾಗಿ ಮಣ್ಣಿಗೆ ಕೊಡಿ — ಎಲೆ ಒದ್ದೆಯಾಗದಿರಲಿ.\n"
        "• ಸಸ್ಯಗಳ ನಡುವೆ ಸಾಕಷ್ಟು ಅಂತರ ಇರಿಸಿ ಒಳ್ಳೆಯ ಗಾಳಿ ಆಡಲು ಅನುವು ಮಾಡಿ.\n\n"
        "⚠️ *ಈ ಮಾಹಿತಿ ಸಂಶೋಧನೆ ಆಧಾರಿತ DRAFT — ದೊಡ್ಡ ಸಮಸ್ಯೆಗೆ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.*"
    )

def _rust_reply_hi() -> str:
    return (
        "🍂 **तुकड़ा/जंग रोग (Aloe Rust - फंगल संक्रमण)**\n\n"
        "**🔎 लक्षण:**\n"
        "• पत्ती की सतह पर छोटे पीले या हल्के धब्बे दिखाई देते हैं।\n"
        "• बाद में ये नारंगी/भूरे रंग के उभरे हुए पस्ट्यूल (फुंसी) बन जाते हैं।\n"
        "• छूने पर जंग जैसा नारंगी पाउडर निकल सकता है।\n\n"
        "**🛠️ प्रबंधन:**\n"
        "• **सफाई:** बुरी तरह संक्रमित पत्तियों को कीटाणुरहित कैंची से काटकर हटाएं।\n"
        "• पानी सीधे मिट्टी में दें — पत्तियों को गीला न करें।\n"
        "• पौधों के बीच पर्याप्त दूरी रखें ताकि हवा का प्रवाह हो।\n\n"
        "⚠️ *यह जानकारी DRAFT है — बड़े प्रकोप के लिए कृषि विशेषज्ञ से सलाह लें।*"
    )

def _anthracnose_reply_kn() -> str:
    return (
        "🥀 **ಆಂಥ್ರಾಕ್ನೋಸ್ (ಶಿಲೀಂಧ್ರ ಗಾಯಗಳು)**\n\n"
        "**🔎 ಲಕ್ಷಣಗಳು:**\n"
        "• ಎಲೆಯ ಮೇಲೆ ಮುಳುಗಿದ, ದುಂಡನೆಯ ಅಥವಾ ಅಂಡಾಕಾರದ ನೀರಿನ ಕಲೆಗಳು.\n"
        "• ತೇವ ಹವಾಮಾನದಲ್ಲಿ ಗಾಯಗಳ ಮೇಲೆ ಗುಲಾಬಿ ಬಣ್ಣದ ಬೀಜಾಣು ರಾಶಿ ಕಾಣಿಸಬಹುದು.\n\n"
        "**🛠️ ನಿರ್ವಹಣೆ:**\n"
        "• **ಸ್ವಚ್ಛತೆ:** ಸೋಂಕಿತ ಎಲೆಗಳನ್ನು ತೆಗೆದು ಕಸದ ತೊಟ್ಟಿಗೆ ಹಾಕಿ (ಗೊಬ್ಬರ ಮಾಡಬೇಡಿ).\n"
        "• ಗಾಳಿ ಆಡಲು ಅನುವು ಮಾಡಿ, ತೇವ ಕಡಿಮೆ ಮಾಡಿ.\n"
        "• ಮಣ್ಣು ಸಂಪೂರ್ಣ ಒಣಗಿದ ನಂತರ ಮಾತ್ರ ನೀರು ಕೊಡಿ.\n\n"
        "⚠️ *ಈ ಮಾಹಿತಿ DRAFT — ದೊಡ್ಡ ಸಮಸ್ಯೆಗೆ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.*"
    )

def _anthracnose_reply_hi() -> str:
    return (
        "🥀 **एन्थ्रेकनोज (फंगल घाव)**\n\n"
        "**🔎 लक्षण:**\n"
        "• पत्ती पर धंसे हुए, गोल या अंडाकार, पानी से भरे दिखने वाले काले घाव।\n"
        "• नम मौसम में घावों पर गुलाबी या नारंगी रंग के बीजाणु दिख सकते हैं।\n\n"
        "**🛠️ प्रबंधन:**\n"
        "• **सफाई:** बुरी तरह संक्रमित पत्तियों को हटाएं (खाद में न डालें)।\n"
        "• नमी कम करें, वेंटिलेशन बढ़ाएं।\n"
        "• मिट्टी पूरी तरह सूखने के बाद ही पानी दें।\n\n"
        "⚠️ *यह जानकारी DRAFT है — बड़े प्रकोप के लिए कृषि विशेषज्ञ से सलाह लें।*"
    )

def _leafspot_reply_kn() -> str:
    return (
        "🍃 **ಎಲೆ ಚುಕ್ಕೆ ರೋಗ (Leaf Spot)**\n\n"
        "**🔎 ಲಕ್ಷಣಗಳು:**\n"
        "• ಎಲೆಯ ಮೇಲೆ ಗೋಲಾಕಾರ ಅಥವಾ ಅನಿಯಮಿತ ಕಂದು/ಕಪ್ಪು ಚುಕ್ಕೆಗಳು.\n"
        "• ಚುಕ್ಕೆಗಳ ಸುತ್ತ ಹಳದಿ ಹಾಲೊ ಇರಬಹುದು ಮತ್ತು ದೊಡ್ಡ ಸತ್ತ ಪ್ರದೇಶಗಳಾಗಬಹುದು.\n\n"
        "**🛠️ ನಿರ್ವಹಣೆ:**\n"
        "• ಹೆಚ್ಚು ಚುಕ್ಕೆ ಹೊಂದಿದ ಎಲೆಗಳನ್ನು ಕತ್ತರಿಸಿ ತೆಗೆಯಿರಿ.\n"
        "• ನೀರಾವರಿ ಸಮಯದಲ್ಲಿ ಎಲೆ ಒದ್ದೆಯಾಗದಂತೆ ನೋಡಿಕೊಳ್ಳಿ.\n"
        "• ಸಸ್ಯದ ಸುತ್ತ ಒಳ್ಳೆಯ ಗಾಳಿ ಆಡಲು ಅನುವು ಮಾಡಿ.\n\n"
        "⚠️ *ಈ ಮಾಹಿತಿ DRAFT — ದೊಡ್ಡ ಸಮಸ್ಯೆಗೆ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.*"
    )

def _leafspot_reply_hi() -> str:
    return (
        "🍃 **पत्ती धब्बा रोग (Leaf Spot)**\n\n"
        "**🔎 लक्षण:**\n"
        "• पत्तियों पर गोल या अनियमित भूरे/काले धब्बे।\n"
        "• धब्बों के चारों ओर पीला घेरा हो सकता है और वे बड़े मृत क्षेत्र बना सकते हैं।\n\n"
        "**🛠️ प्रबंधन:**\n"
        "• अधिक धब्बे वाली पत्तियों को कीटाणुरहित उपकरण से काटकर हटाएं।\n"
        "• सिंचाई के दौरान पत्तियों को गीला होने से बचाएं।\n"
        "• अच्छे वायु संचार का प्रबंध करें।\n\n"
        "⚠️ *यह जानकारी DRAFT है — बड़े प्रकोप के लिए कृषि विशेषज्ञ से सलाह लें।*"
    )

def _sunburn_reply_kn() -> str:
    return (
        "☀️ **ಸನ್‌ಬರ್ನ್ (ಬಿಸಿಲು ಹಾನಿ — ರೋಗ ಅಲ್ಲ!)**\n\n"
        "**🔎 ಲಕ್ಷಣಗಳು:**\n"
        "• ಸೂರ್ಯನ ಬೆಳಕಿಗೆ ತೆರೆದ ಎಲೆಯ ಮೇಲ್ಭಾಗದಲ್ಲಿ ಕೆಂಪು, ಕಂಚು ಅಥವಾ ಬಿಳಿ ಒಣ ಪ್ಯಾಚ್.\n"
        "• ಪ್ರಭಾವಿತ ಪ್ರದೇಶ ಒಣಗಿ ಕಾಗದದಂತೆ ಆಗುತ್ತದೆ — ಬೀಜಾಣು ಅಥವಾ ತೇವ ಇರುವುದಿಲ್ಲ.\n\n"
        "**🛠️ ನಿರ್ವಹಣೆ:**\n"
        "• **⛔ ಶಿಲೀಂಧ್ರನಾಶಕ ಬಳಸಬೇಡಿ!** ಇದು ಬಿಸಿಲು ಹಾನಿ, ಸೋಂಕಲ್ಲ.\n"
        "• ಸಸ್ಯವನ್ನು ಪ್ರಕಾಶಮಾನ ಆದರೆ ಪರೋಕ್ಷ ಬೆಳಕಿಗೆ ಸ್ಥಳಾಂತರಿಸಿ.\n"
        "• ಹೊರಗೆ ಬಿಡುವಾಗ ಮಧ್ಯಾಹ್ನ 11 ರಿಂದ 4 ರ ವರೆಗೆ 30-50% ನೆರಳು ಬಟ್ಟೆ ಬಳಸಿ.\n\n"
        "⚠️ *ಈ ಮಾಹಿತಿ DRAFT — ದೊಡ್ಡ ಸಮಸ್ಯೆಗೆ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.*"
    )

def _sunburn_reply_hi() -> str:
    return (
        "☀️ **धूप से जलन (Sunburn — यह बीमारी नहीं है!)**\n\n"
        "**🔎 लक्षण:**\n"
        "• सूरज की धूप से प्रभावित पत्ती के ऊपरी भाग पर लाल, कांस्य या सफेद सूखे धब्बे।\n"
        "• प्रभावित क्षेत्र सूखा और कागज़ जैसा होता है — कोई बीजाणु या गीलापन नहीं।\n\n"
        "**🛠️ प्रबंधन:**\n"
        "• **⛔ कभी भी फफूंदनाशक का उपयोग न करें!** यह UV/गर्मी से चोट है, संक्रमण नहीं।\n"
        "• पौधे को तेज़ लेकिन अप्रत्यक्ष रोशनी में ले जाएं।\n"
        "• बाहर रखने पर दोपहर 11 बजे से 4 बजे के बीच 30-50% छाया कपड़ा लगाएं।\n\n"
        "⚠️ *यह जानकारी DRAFT है — बड़े प्रकोप के लिए कृषि विशेषज्ञ से सलाह लें।*"
    )

def _healthy_reply_kn() -> str:
    return (
        "🌱 **ಆರೋಗ್ಯಕರ ಆಲೋ ವೇರಾ — ತಡೆಗಟ್ಟುವ ಆರೈಕೆ ಮಾರ್ಗದರ್ಶಿ**\n\n"
        "**💧 ನೀರಾವರಿ:**\n"
        "• ಆಳವಾಗಿ ನೀರು ಕೊಡಿ, ನಂತರ ಮೇಲಿನ 2 ಇಂಚು ಮಣ್ಣು ಒಣಗುವವರೆಗೆ ಕಾಯಿರಿ.\n"
        "• ಕುಂಡದಲ್ಲಿ ನಿಂತ ನೀರು ಬಿಡಬೇಡಿ (ಬೇರು ಕೊಳೆತ ಆಗುತ್ತದೆ).\n\n"
        "**☀️ ಬೆಳಕು:**\n"
        "• ದಿನಕ್ಕೆ 6-8 ಗಂಟೆ ಪ್ರಕಾಶಮಾನ ಆದರೆ ಪರೋಕ್ಷ ಸೂರ್ಯನ ಬೆಳಕು.\n"
        "• ಮಧ್ಯಾಹ್ನದ ನೇರ ಬಿಸಿಲನ್ನು ತಪ್ಪಿಸಿ — ಸನ್‌ಬರ್ನ್ ಆಗುತ್ತದೆ.\n\n"
        "**🪴 ಮಣ್ಣು ಮತ್ತು ಕುಂಡ:**\n"
        "• ಪರ್ಲೈಟ್ ಅಥವಾ ಒರಟು ಮರಳಿನೊಂದಿಗೆ ಕ್ಯಾಕ್ಟಸ್ ಮಿಶ್ರ ಮಣ್ಣು ಬಳಸಿ.\n"
        "• ಯಾವಾಗಲೂ ನೀರು ಹರಿದು ಹೋಗುವ ರಂಧ್ರ ಇರುವ ಕುಂಡ ಬಳಸಿ.\n\n"
        "✅ *ಆರೋಗ್ಯಕರ ಸಸ್ಯಗಳಿಗೆ ರಾಸಾಯನಿಕ ಚಿಕಿತ್ಸೆ ಬೇಡ.*"
    )

def _healthy_reply_hi() -> str:
    return (
        "🌱 **स्वस्थ एलो वेरा — निवारक देखभाल मार्गदर्शिका**\n\n"
        "**💧 पानी देना:**\n"
        "• गहराई से पानी दें, फिर ऊपरी 2 इंच मिट्टी पूरी तरह सूखने तक प्रतीक्षा करें।\n"
        "• गमले में खड़ा पानी न छोड़ें (जड़ सड़ जाती है)।\n\n"
        "**☀️ रोशनी:**\n"
        "• प्रतिदिन 6-8 घंटे तेज़ लेकिन अप्रत्यक्ष धूप।\n"
        "• तेज़ दोपहर की धूप से बचाएं — सनबर्न हो सकता है।\n\n"
        "**🪴 मिट्टी और गमला:**\n"
        "• पर्लाइट या मोटे रेत के साथ कैक्टस मिश्रण मिट्टी उपयोग करें।\n"
        "• हमेशा जल निकासी छेद वाले गमले का उपयोग करें।\n\n"
        "✅ *स्वस्थ पौधों के लिए किसी रासायनिक उपचार की आवश्यकता नहीं।*"
    )

def _greeting_reply_kn() -> str:
    return (
        "ನಮಸ್ಕಾರ! 👋 ನಾನು **AloeMithra**, ನಿಮ್ಮ ಆಲೋ ವೇರಾ ಆರೋಗ್ಯ ಸಹಾಯಕ!\n\n"
        "ನಾನು ಈ ವಿಷಯಗಳ ಬಗ್ಗೆ ಉತ್ತರಿಸಬಲ್ಲೆ:\n"
        "1. 🍂 **ತುಕ್ಕು ರೋಗ** (Aloe Rust)\n"
        "2. 🥀 **ಆಂಥ್ರಾಕ್ನೋಸ್** (ಕಪ್ಪು ಕಲೆ)\n"
        "3. 🍃 **ಎಲೆ ಚುಕ್ಕೆ** (Leaf Spot)\n"
        "4. ☀️ **ಸನ್‌ಬರ್ನ್** (ಬಿಸಿಲು ಹಾನಿ)\n"
        "5. 🌱 **ಸಾಮಾನ್ಯ ಆರೈಕೆ** (ನೀರು, ಮಣ್ಣು, ಬೆಳಕು)\n\n"
        "ಕೇಳಿ: *'ತುಕ್ಕು ರೋಗ ಏನು?'* ಅಥವಾ *'ಎಲೆ ಚುಕ್ಕೆಗೆ ಏನು ಮಾಡಬೇಕು?'*"
    )

def _greeting_reply_hi() -> str:
    return (
        "नमस्ते! 👋 मैं **AloeMithra** हूं, आपका एलो वेरा स्वास्थ्य सहायक!\n\n"
        "मैं इन विषयों पर जवाब दे सकता हूं:\n"
        "1. 🍂 **जंग रोग** (Aloe Rust)\n"
        "2. 🥀 **एन्थ्रेकनोज** (काले धब्बे)\n"
        "3. 🍃 **पत्ती धब्बा** (Leaf Spot)\n"
        "4. ☀️ **सनबर्न** (धूप से जलन)\n"
        "5. 🌱 **सामान्य देखभाल** (पानी, मिट्टी, रोशनी)\n\n"
        "पूछें: *'जंग रोग क्या है?'* या *'सनबर्न का इलाज?'*"
    )

def _fallback_reply_kn(original_msg: str) -> str:
    return (
        f"🌿 ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಅರ್ಥವಾಯಿತು, ಆದರೆ **\"{original_msg[:60]}\"** ಗೆ ನಿರ್ದಿಷ್ಟ ಉತ್ತರ ಕಂಡು ಹಿಡಿಯಲಿಲ್ಲ.\n\n"
        "ನಾನು ಇವುಗಳ ಬಗ್ಗೆ ಹೇಳಬಲ್ಲೆ:\n"
        "• 🍂 ತುಕ್ಕು ರೋಗ\n• 🥀 ಆಂಥ್ರಾಕ್ನೋಸ್\n• 🍃 ಎಲೆ ಚುಕ್ಕೆ\n• ☀️ ಸನ್‌ಬರ್ನ್\n• 🌱 ಸಾಮಾನ್ಯ ಆರೈಕೆ"
    )

def _fallback_reply_hi(original_msg: str) -> str:
    return (
        f"🌿 आपका सवाल समझ आया, लेकिन **\"{original_msg[:60]}\"** के लिए कोई विशेष उत्तर नहीं मिला।\n\n"
        "मैं इन विषयों पर जवाब दे सकता हूं:\n"
        "• 🍂 जंग रोग\n• 🥀 एन्थ्रेकनोज\n• 🍃 पत्ती धब्बा\n• ☀️ सनबर्न\n• 🌱 सामान्य देखभाल"
    )


# ---------------------------------------------------------------------------
# Main Entry Point
# ---------------------------------------------------------------------------

def generate_bot_reply(user_msg: str, lang: str = "en") -> str:
    """
    Generate a research-safe, multilingual response for Aloe vera queries.
    Supports English (typo-tolerant), Kannada (kn), and Hindi (hi).
    The `lang` parameter controls which language to reply in.
    """
    if not user_msg or not user_msg.strip():
        if lang == "kn":
            return _greeting_reply_kn()
        if lang == "hi":
            return _greeting_reply_hi()
        return _greeting_reply()

    original = user_msg.strip()
    msg = _normalize(user_msg)

    # 1. Greeting
    if _any_keyword(GREET_KW, msg):
        if lang == "kn":
            return _greeting_reply_kn()
        if lang == "hi":
            return _greeting_reply_hi()
        return _greeting_reply()

    # 2. Aloe Rust — check before leaf spot to avoid partial matches
    if _any_keyword(RUST_KW, msg):
        if lang == "kn":
            return _rust_reply_kn()
        if lang == "hi":
            return _rust_reply_hi()
        return _rust_reply()

    # 3. Anthracnose
    if _any_keyword(ANTHR_KW, msg):
        if lang == "kn":
            return _anthracnose_reply_kn()
        if lang == "hi":
            return _anthracnose_reply_hi()
        return _anthracnose_reply()

    # 4. Leaf Spot
    if _any_keyword(LEAFSPOT_KW, msg):
        if lang == "kn":
            return _leafspot_reply_kn()
        if lang == "hi":
            return _leafspot_reply_hi()
        return _leafspot_reply()

    # 5. Sunburn
    if _any_keyword(SUNBURN_KW, msg):
        if lang == "kn":
            return _sunburn_reply_kn()
        if lang == "hi":
            return _sunburn_reply_hi()
        return _sunburn_reply()

    # 6. Healthy / General Care
    if _any_keyword(HEALTHY_KW, msg):
        if lang == "kn":
            return _healthy_reply_kn()
        if lang == "hi":
            return _healthy_reply_hi()
        return _healthy_reply()

    # 7. Generic symptom or treatment question — give menu
    if _any_keyword(SYMPTOM_KW + TREATMENT_KW, msg):
        if lang == "kn":
            return _greeting_reply_kn()
        if lang == "hi":
            return _greeting_reply_hi()
        return _greeting_reply()

    # 8. Fallback
    if lang == "kn":
        return _fallback_reply_kn(original)
    if lang == "hi":
        return _fallback_reply_hi(original)
    return _fallback_reply(original)
