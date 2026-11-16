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
    # Kannada
    "ತುಕ್ಕು", "ತುಕ್ಕು ರೋಗ", "ಆಲೋ ತುಕ್ಕು", "ಕಿತ್ತಳೆ ಚುಕ್ಕೆ",
    "ಕಂದು ಗುಳ್ಳೆ", "ಶಿಲೀಂಧ್ರ ರೋಗ",
    # Hindi
    "जंग", "रतुआ", "एलो रस्ट", "नारंगी धब्बे", "भूरे उभार", "फंगल धब्बे",
    "पत्ती पर जंग", "जंग रोग",
]

# ── Anthracnose ────────────────────────────────────────────────────────────
ANTHR_KW = [
    # English
    "anthracnose", "sunken spot", "black spot", "water soaked", "water-soaked",
    "dark lesion", "oval spot", "anthracnos", "anthrcnose", "antracnose",
    "dark spot", "wet spot", "rotting spot", "leaf rot", "anthracnose cure",
    "anthracnose treatment", "anthracnose symptom",
    # Kannada
    "ಆಂಥ್ರಾಕ್ನೋಸ್", "ಕಪ್ಪು ಚುಕ್ಕೆ", "ಮುಳುಗಿದ ಚುಕ್ಕೆ", "ನೀರಿನ ಕಲೆ",
    "ತೇವ ಕಲೆ", "ಕಪ್ಪು ಕಲೆ ರೋಗ",
    # Hindi
    "एन्थ्रेकनोज", "काला धब्बा", "धंसे धब्बे", "पानी भरे धब्बे",
    "गहरे घाव", "काले धब्बे",
]

# ── Leaf Spot ──────────────────────────────────────────────────────────────
LEAFSPOT_KW = [
    # English
    "leaf spot", "leafspot", "brown spot", "circular spot", "spots on leaf",
    "yellow halo", "irregular spot", "spotted leaf", "spot disease",
    "leaf spot treatment", "leaf spot cure", "leaf spotting",
    # Kannada
    "ಎಲೆ ಚುಕ್ಕೆ", "ಎಲೆ ಮೇಲೆ ಚುಕ್ಕೆ", "ಬ್ರೌನ್ ಚುಕ್ಕೆ", "ಗೋಲಾಕಾರ ಚುಕ್ಕೆ",
    "ಹಳದಿ ಹಾಲೊ", "ಚುಕ್ಕೆ ರೋಗ",
    # Hindi
    "पत्ती धब्बा", "पत्ते पर धब्बा", "भूरे गोल धब्बे", "पीला घेरा",
    "धब्बे रोग", "लीफ स्पॉट",
]

# ── Sunburn ────────────────────────────────────────────────────────────────
SUNBURN_KW = [
    # English
    "sunburn", "sun burn", "sun damage", "uv damage", "solar", "bleached leaf",
    "bronze leaf", "red leaf", "brown tip", "white patch", "scorched", "burnt leaf",
    "sunscorch", "sun scorch", "too much sun", "sun stress", "light burn",
    "heat damage", "heat stress", "sunburn treatment", "sunburn cure",
    # Kannada
    "ಸೂರ್ಯ ಬೆಂಕಿ", "ಸನ್‌ಬರ್ನ್", "ಬಿಸಿಲು ಹಾನಿ", "ಎಲೆ ಸುಡುವಿಕೆ",
    "ಕೆಂಪು ಎಲೆ", "ಬೆಳ್ಳನೆ ಎಲೆ", "ಶಾಖ ಒತ್ತಡ",
    # Hindi
    "धूप से जलन", "सनबर्न", "धूप की क्षति", "झुलसी पत्ती", "लाल पत्ती",
    "सफेद धब्बा", "गर्मी से नुकसान", "यूवी नुकसान",
]

# ── Healthy / General Care ─────────────────────────────────────────────────
HEALTHY_KW = [
    # English
    "healthy", "normal", "water", "watering", "soil", "pot", "fertilize",
    "fertiliser", "fertilizer", "care", "grow", "light", "sunlight",
    "repot", "drainage", "how to grow", "how to care", "aloe care",
    "general care", "prevent disease", "prevention", "maintenance",
    "healthy aloe", "keep healthy", "potting mix",
    # Kannada
    "ಆರೋಗ್ಯಕರ", "ನೀರು ಹಾಕುವುದು", "ಮಣ್ಣು", "ಬೆಳಕು", "ಗೊಬ್ಬರ",
    "ಆಲೋ ವೇರಾ ಆರೈಕೆ", "ತಡೆಗಟ್ಟುವಿಕೆ", "ನಿರ್ವಹಣೆ",
    # Hindi
    "स्वस्थ", "पानी देना", "मिट्टी", "रोशनी", "खाद", "देखभाल",
    "एलो वेरा की देखभाल", "रोकथाम", "रखरखाव",
]

# ── Greeting ───────────────────────────────────────────────────────────────
GREET_KW = [
    # English
    "hello", "hi", "hey", "good morning", "good evening", "howdy", "help",
    "start", "begin", "what can you do", "what do you know",
    # Kannada
    "ನಮಸ್ಕಾರ", "ಹಲೋ", "ಹಾಯ್", "ನಿಮಗೆ ನಮಸ್ಕಾರ",
    # Hindi
    "नमस्ते", "हेलो", "हाय", "मदद", "शुरू",
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
# Main Entry Point
# ---------------------------------------------------------------------------

def generate_bot_reply(user_msg: str) -> str:
    """
    Generate a research-safe, multilingual response for Aloe vera queries.
    Supports English (typo-tolerant), Kannada, and Hindi.
    """
    if not user_msg or not user_msg.strip():
        return _greeting_reply()

    original = user_msg.strip()
    msg = _normalize(user_msg)

    # 1. Greeting
    if _any_keyword(GREET_KW, msg):
        return _greeting_reply()

    # 2. Aloe Rust — check before leaf spot to avoid partial matches
    if _any_keyword(RUST_KW, msg):
        return _rust_reply()

    # 3. Anthracnose
    if _any_keyword(ANTHR_KW, msg):
        return _anthracnose_reply()

    # 4. Leaf Spot
    if _any_keyword(LEAFSPOT_KW, msg):
        return _leafspot_reply()

    # 5. Sunburn
    if _any_keyword(SUNBURN_KW, msg):
        return _sunburn_reply()

    # 6. Healthy / General Care
    if _any_keyword(HEALTHY_KW, msg):
        return _healthy_reply()

    # 7. Generic symptom or treatment question — give menu
    if _any_keyword(SYMPTOM_KW + TREATMENT_KW, msg):
        return _greeting_reply()

    # 8. Fallback
    return _fallback_reply(original)
