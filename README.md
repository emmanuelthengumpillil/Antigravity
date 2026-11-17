# FocusMind — Final Product of Hackathon

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js / React](https://img.shields.io/badge/Next.js-React_19-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Face_Mesh-0072C6.svg)](https://developers.google.com/mediapipe)
[![Google Gemini](https://img.shields.io/badge/Gemini_API-Interactions-8E75B2.svg?logo=google&logoColor=white)](https://ai.google.dev)

> **FocusMind** is an ambient, OLED-black deep focus and coding platform engineered for high-cognition programming and distraction-free learning. It combines real-time facial telemetry (MediaPipe 468+ landmarks), dual-mode conversational AI tutoring (Teacher Bot & Feynman Student Bot powered by Google Gemini), biometric face-locking, cross-device room synchronization with animated mascot pairing, and an ambient sensory flow canvas completely free of clock-watching timer anxiety.

---

## 🚀 Instructions to Run the Code (Quick Start)

### Step 1: Install Git & Python
Ensure Git and Python 3.11+ are installed on your system.

### Step 2: Clone the Repository
```bash
git clone https://github.com/emmanuelthengumpillil/Antigravity
```

### Step 3: Navigate to Backend
```bash
cd Antigravity\backend
```

### Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 5: Start the FocusMind Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Open your browser and navigate to **[http://127.0.0.1:8000](http://127.0.0.1:8000)** to experience the platform.

### Step 6: Run Automated Tests
```bash
python -m pytest tests/test_backend.py
```
*(All 12 automated unit and integration tests execute and pass 100%).*

---

## 🌟 Key Architecture & Capabilities

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                DYNAMIC ISLAND                                     │
│  [🤖 Stanley Avatar]  [State: FOCUSED]  [Streak: 5d • 520 pts]  [📷 98% Telemetry]│
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
       ┌──────────────────────────────────┼──────────────────────────────────┐
       ▼                                  ▼                                  ▼
┌──────────────┐              ┌───────────────────────┐            ┌───────────────────┐
│ GEMINI RAIL  │              │     FOCUS CANVAS      │            │ CODING WORKSPACE  │
│ • Flow Score │              │  4s Rhythmic Breathe  │            │ • Monaco Editor   │
│ • Mind Runtimes             │     Concentric Orb    │            │ • Code Execution  │
│ • Apple Rings│              │   ┌───────────────┐   │            │ • Dual AI Tutor   │
│ • Leaderboard│              │   │  FLOW STATE   │   │            │   - Teacher Bot   │
│ • Zoom Co-Host              │   │  FOCUS MIND   │   │            │   - Feynman Bot   │
│ • Sync Status│              │   │ [⚡Adaptive]  │   │            │ • Gemini 2.5 Agent│
└──────────────┘              │   └───────────────┘   │            └───────────────────┘
                              └───────────────────────┘
```

### 1. Ambient Zero-Timer Focus Canvas
- **Zero Countdown Clock Anxiety**: Standard countdown timers (`00:25:00`), ticking clocks, and time-pressure indicators are eliminated from the center screen.
- **Concentric Breathing Focus Orb**: Rhythmic 4-second breathing resonator with hairline ambient progress ring and emotion-reactive aura shifts.
- **Centerpiece**: Prominent **`FOCUS MIND`** typography housed in the core nucleus.
- **Adaptive Test Button**: Integrated directly into the center of the orb, offering algorithmic diagnostic questions that award **+50 streak points** with confetti upon mastery.

### 2. Real-Time Vision & Emotion Engine
- **MediaPipe 468+ 3D Face Mesh**: Continuously extracts Eye Aspect Ratio (EAR), gaze stability, head pitch slump, and presence confidence directly in-browser.
- **Cognitive State Inference**: Automatically classifies mental state into `FOCUSED`, `ENGAGED`, `PRESENT`, `DROWSY`, `SLEEPING`, and `AWAY`.
- **Target Person Biometric Lock**: Learners can upload their profile photo; the engine calibrates their 3D facial height-to-width aspect ratio signature and safely ignores passersby or secondary people.

### 3. Amplified Emergency Interventions & Sound Alert
- **1-Minute Drowsiness Chime**: Ascending 4-note chord at boosted volume (`0.70 gain`) with dual haptic vibration pulses (`[250ms, 100ms, 250ms]`).
- **Emergency Sleeping Siren**: Triple-oscillator emergency alarm (950Hz–1900Hz sawtooth + 1450Hz discord + 440Hz sub-bass horn) at peak volume (`0.85 gain`) with synchronized multi-pulse haptic vibration (`[400ms, 150ms, 400ms, 150ms, 500ms]`).

### 4. Dual-Mode AI Tutoring with Google Gemini
- **Teacher Bot Mode**: Socratic educator providing intuition, step-by-step hints, time/space complexity analysis, and analogies without giving away code.
- **Feynman Student Bot Mode**: Flips the script—the user becomes the educator explaining concepts to an inquisitive AI novice.
- **Dual Engine**: Direct integration with the Google Gemini API (`gemini-2.5-flash`, `gemini-1.5-flash`) via the modern Interactions SDK with automated fallback to free open-weights endpoints.

### 5. Cross-Device Synchronization & Pairing
- **Multi-Device Pairing**: Instant room generation (e.g. `FM-1001`) with real-time vector QR code matrices.
- **Loading Stanley Mascot**: Interactive animated micro-robot avatar displaying antenna pings and radar scan rings during key synchronization.
- **State Sync**: Real-time WebSocket broadcasting sharing code edits, dual-mode chat messages, and device states across tablets, phones, and laptops.

### 6. Continuous Streak Gamification System
- **Active Focus Accumulation**: Awards +5 base points every 10 seconds of verified attention, boosted by **1.2x** (>90s) and **1.5x** (>300s) continuous flow multipliers.
- **Mastery Bonuses**: +25 points on successful code test pass, and +50 points on adaptive test completion.
- **Calendar Retention**: Automatic tracking of consecutive active days stored in `localStorage`.

### 7. Zoom Classroom Integration
- Co-host privilege assignment, waiting room enforcement, and screen sharing lockdown rules accessible through the Gemini rail.

---

## 📂 Project Structure

```
focusmind/
├── README.md                           # Hackathon documentation & run instructions
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application, WebSocket hub, AI tutoring
│   │   ├── models.py                   # Pydantic schemas (Rooms, Telemetry, Gemini Agent)
│   │   └── tutor_engine.py             # Socratic logic & Gemini API integration
│   ├── static/
│   │   ├── index.html                  # OLED black layout, Dynamic Island, Focus Canvas
│   │   ├── styles.css                  # Tailwind styles & breathing animations
│   │   └── app.js                      # Vision engine, Web Audio synthesis, WebSocket sync
│   ├── tests/
│   │   └── test_backend.py             # Pytest test suite (12 test cases)
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/
        │   ├── DeepFocusOrb.tsx        # Breathing concentric resonator with FOCUS MIND
        │   ├── AdaptiveTestModal.tsx   # Algorithmic diagnostic challenges (+50 pts)
        │   ├── MultiDeviceSyncModal.tsx# Cross-device pairing with Loading Stanley
        │   ├── DynamicIsland.tsx       # Live status & micro-robot companion
        │   ├── CodingWorkspace.tsx     # Monaco Editor & LeetCode environment
        │   ├── AITutor.tsx             # Dual-Mode Gemini Teacher & Feynman Bot
        │   └── FocusPlatform.tsx       # Next.js multi-panel layout
        └── hooks/
            └── useEmotionEngine.js     # MediaPipe telemetry & continuous points
```

---

## 🏆 Hackathon Submission Highlights
- **Human-Centered AI Design**: Solves real developer fatigue and ADHD focus decay through sensory rhythm rather than anxiety-inducing countdown timers.
- **Multimodal Intelligence**: Integrates real-time edge computer vision with state-of-the-art LLM tutoring.
- **Cross-Device Ready**: Seamless live transition from desktop code editor to iPad/phone companion view.

---

*FocusMind — Built for the Hackathon.*
