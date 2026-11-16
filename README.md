# AloeMithra 🌿

**AloeMithra** is a mobile-first web application designed to detect Aloe vera leaf health conditions from photographs and provide research-based management guidance.

---

## Current Status: All Phases (1 through 5) Completed 🎉

### Phase 1: Foundation, Inference & Status Handling
- **Mobile-First Interface**: Clean centered layout, large buttons, photography tips, camera capture (`st.camera_input`), and file uploader.
- **Strict Status Handling**: All 4 contract statuses (`confident`, `possible`, `retake_low_confidence`, `retake_no_leaf`) handled per research constraints.
- **Safety Knowledge Base (`data/knowledge_base/*.json`)**: Generic safe steps only, `DRAFT_NEEDS_EXPERT_REVIEW`, non-fungicide sunburn rule, preventive-only healthy rule.
- **Decoupled Predictor (`core/predictor.py`)**: UI completely decoupled from ML inference.

### Phase 2: Accounts, SQLite Database & History Tracking
- **SQLite Database (`core/db.py`)**: Local database at `data/aloemithra.db` storing users and leaf analysis history.
- **Secure Authentication (`core/auth.py`)**: Passwords hashed with `bcrypt`, never saved in plain text.
- **Photo Consent Enforcement**: Uploaded photos are converted to thumbnails and saved in history **only if the user explicitly checks** *"Save my photo in my history"*; otherwise, only the numerical diagnosis is stored to protect privacy.
- **History Management (`pages/2_History.py`)**: Users can review their past diagnoses, view dates and thumbnails, delete individual records, or clear all history.

### Phase 3: Knowledge-Base Polish & Result Page Layout
- **Knowledge Base Validation (`core/knowledge.py`)**: Strict schema validator (`validate_kb_entry`) verifying all 5 conditions, status `DRAFT_NEEDS_EXPERT_REVIEW`, placeholder requirements, and safety checks.
- **Polished Result Layout (`pages/1_Analyze.py`)**:
  - Honest confidence meter with percentage display.
  - Clear condition badge, category (`Disease`, `Environmental`, `Healthy`), and expert review tag.
  - Dedicated tabs for Sanitation, Cultural, Biological, Chemical, and Precautions.
  - Categorized Evidence Level tags (`Aloe-specific`, `General plant pathology`, `None`) and expandable scientific citations.
  - Post-analysis quick action buttons ("Analyze Another Leaf" & "View My History").
  - Mandatory agricultural disclaimer banner.

### Phase 4: Language Switching Polish (Kannada & Hindi)
- **Zero Hard-Coded UI Text**: Full key parity across English (`locales/en.json`), Kannada (`locales/kn.json`), and Hindi (`locales/hi.json`).
- **Review Marker**: Kannada and Hindi files marked with `_meta: "NEEDS_NATIVE_REVIEW"`.
- **User Profile Language Persistence**: Selected language persists in the user's database profile and reloads upon login.

### Phase 5: Mobile-Friendly Polish, About Page & End-to-End Tests
- **About Page (`pages/3_About.py`)**: Details project background, EfficientNetB0 Keras 3 architecture, the **83% validation accuracy**, and explicitly notes that the model was trained on dark plain backgrounds and has not been tested on real field photos.
- **Comprehensive Test Suite**: 28 automated unit and end-to-end integration tests passing via `pytest`.

---

## Quickstart

### 1. Requirements & Dependencies
Ensure Python 3.10+ (tested on Python 3.12.5) is installed. Install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Run Tests (Mock Predictor)
Verify all status handling and safety constraints without needing a GPU or trained model weights:
```bash
python -m pytest tests/ -v
```

### 3. Run the App (One-Click Launch)

#### Option A: Quick 1-Click Launch (Windows)
Double-click the [`start_aloemithra.bat`](file:///e:/AloeMithra/start_aloemithra.bat) file in the project folder. It will automatically start the Flask AI backend, the React frontend, and open your browser at:
`http://localhost:5173`

To stop the servers at any time, double-click [`stop_aloemithra.bat`](file:///e:/AloeMithra/stop_aloemithra.bat).

#### Option B: Terminal Launch
1. **Start the AI Backend** (in one terminal):
   ```bash
   python api/app.py
   ```
2. **Start the React Frontend** (in a second terminal):
   ```bash
   cd frontend
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

---

## Predictor Contract

The prediction function in `core/predictor.py` adheres to the following contract:

```python
predict(PIL_image) -> {
    "status": "confident" | "possible" | "retake_low_confidence" | "retake_no_leaf",
    "confidence": float,           # 0.0 to 1.0
    "label": str,                  # Omitted when status is retake_low_confidence
    "second_label": str,
    "second_confidence": float,    # 0.0 to 1.0
    "probabilities": dict[str, float]
}
```

To use your own predictor implementation, replace or update `core/predictor.py` while keeping this return signature.

---

## Project Structure

```text
AloeMithra/
├── app.py                      # Home page with hero, navigation, and language selector
├── pages/
│   ├── 1_Analyze.py            # Leaf analysis with photo tips, camera/upload & status display
│   ├── 2_History.py            # Auth (sign-in/sign-up) & saved diagnosis history
│   ├── 3_About.py              # Settings, project info, model limitations & disclaimers
│   ├── 4_Chatbot.py            # Conversational chatbot for Aloe vera care questions
│   └── 5_Voice_Assistant.py    # Voice-style query interface powered by the assistant engine
├── core/
│   ├── predictor.py            # Model inference contract & EfficientNetB0 loader
│   ├── knowledge.py            # Knowledge base reader & schema validator
│   ├── assistant.py            # Research-safe bot reply engine (shared by Chatbot & Voice)
│   ├── i18n.py                 # Multi-language translation loader (EN / KN / HI)
│   ├── db.py                   # SQLite database: users & leaf analysis history
│   └── auth.py                 # Authentication: bcrypt hashing, sign-in, sign-up, sign-out
├── data/
│   └── knowledge_base/         # Safety-compliant JSON condition profiles
│       ├── aloe_rust.json
│       ├── anthracnose.json
│       ├── healthy.json
│       ├── leaf_spot.json
│       └── sunburn.json
├── locales/                    # Translation files
│   ├── en.json
│   ├── kn.json
│   └── hi.json
├── models/
│   └── effb0_224_fullft_noweights.keras
├── assets/
│   ├── style.css               # Mobile-first CSS styling
│   ├── logo.png
│   ├── bg.jpg
│   └── dashboard_hero.jpg
├── tests/
│   ├── test_status_handling.py
│   ├── test_phase2_auth_history.py
│   ├── test_phase3_knowledge_base.py
│   ├── test_phase4_i18n.py
│   └── test_phase5_e2e.py
└── requirements.txt
```
