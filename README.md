# SR24+ Reality Checker — AI Behavioral Intelligence Engine

<div align="center">

![SR24+ Reality Checker](https://img.shields.io/badge/SR24%2B-Reality%20Checker-00f3ff?style=for-the-badge&labelColor=0a0a0f)
![Version](https://img.shields.io/badge/Version-3.2-blueviolet?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)
![Firebase](https://img.shields.io/badge/Database-Firebase-orange?style=for-the-badge&logo=firebase)

**The most advanced AI-powered Behavioral Intelligence Engine that tracks human behavior, productivity, emotional patterns, and decision-making with high-fidelity 16-step analysis.**

[🚀 Live Demo](https://sr24plus-reality-checker.vercel.app) • [📖 Documentation](#-how-it-works) • [⚙️ Setup](#-setup--installation)

</div>

---

## 🧠 What is SR24+ Reality Checker?

SR24+ Reality Checker is a **Premium AI Life Intelligence System** — not just a tracking app, but a high-fidelity behavioral analyst that:

- **Scans** your daily logs for deep psychological patterns
- **Analyzes** your "Execution Gap" (Planned vs Actual effort)
- **Detects** early signs of **Burnout** and **Dopamine Loop** addiction
- **Generates** a comprehensive 16-step diagnostic report
- **Presets** tactical recovery protocols and next-day action plans

> Think of it as a premium behavioral lab + productivity coach — built for elite optimization.

---

## ✨ Features

### 🔍 16-Step AI Behavioral Intelligence Engine
Every scan generates a high-fidelity diagnostic report:

| # | Module | What it gives you |
|---|--------|-------------------|
| 1 | **Core State Analysis** | Emotional state, mental energy, focus & discipline levels |
| 2 | **Life Score System** | Discipline, Focus, Consistency & Mental Stability scores (0–100) |
| 3 | **Execution Gap Analysis** | Measures the gap between your intent and action (Planned vs Actual) |
| 4 | **Trigger Detection** | Pinpoints the root cause of mood or behavior shifts |
| 5 | **Behavior Timeline** | Contextual analysis of your trend across the last 10 logs |
| 6 | **Personality Profile** | Synthesizes your long-term psychological traits |
| 7 | **Behavior Pattern** | Deep detection of recurring habits and cycles |
| 8 | **Future Prediction** | Probabilistic outcomes if current patterns continue |
| 9 | **Burnout Detector** | Real-time risk assessment (Low/Med/High) with explanation |
| 10 | **Dopamine Loop Check** | Detection of cheap dopamine seeking or distraction loops |
| 11 | **Recovery Protocol** | Tactical steps to reset mental state immediately |
| 12 | **Next-Day Action Plan** | 3 concrete, high-impact tasks for tomorrow |
| 13 | **Goal Alignment Check** | Evaluates current behavior against your long-term vision |
| 14 | **Micro-Win Tracking** | Identifies overlooked positive momentum points |
| 15 | **AI Coach Reflection** | A personalized high-context memo from the coach |
| 16 | **Brutal Reality Check** | The unfiltered, harsh truth to snap you back to reality |

### 📈 Neural Analytics & Dashboard
- **Neural Indicators** — Real-time tracking of Burnout Risk and Dopamine status
- **Execution Gap Viz** — Visual progress bar of your actual performance vs targets
- **Archives (Timeline)** — Expandable scan history with full reports for every entry
- **Neural Balance Chart** — Success vs Failure (Right vs Wrong) visualized over time

### 👤 Profile & Behavioral DNA
- Set your **Long-Term Goal** for AI-aligned evaluation
- **Aggregated Personality DNA** — Synthesized traits across your entire history
- **Neural Level System** — Level up based on scan consistency

### 🔐 Secure & Private
- Google Sign-In via Firebase Authentication
- All data stored in your **private Firestore vault** — strictly owned by you
- Firestore Security Rules enforce zero-access to other users

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | TailwindCSS v4 + Custom Neural UI |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **AI Engine** | Groq (Llama 3.3 70B) / xAI Grok / Google Gemini |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **Database** | Cloud Firestore (Firebase) |
| **Deployment** | Vercel |

---

## 🤖 AI Provider Support

The app supports **3 AI providers** — just set the right env variable and it auto-switches:

| Provider | Env Variable | Model | Best For |
|----------|-------------|-------|----------|
| **Groq** ⭐ Recommended | `GROQ_API_KEY` | Llama 3.3 70B | Extreme Speed + Quality |
| **xAI Grok** | `GROK_API_KEY` | grok-3-mini | High reasoning quality |
| **Google Gemini** | `GEMINI_API_KEY` | gemini-2.0-flash | Reliable fallback |

**Priority:** `GROQ_API_KEY` → `GROK_API_KEY` → `GEMINI_API_KEY`

---

## ⚙️ Setup & Installation

### 1. Configure Firebase
Create a `firebase-applet-config.json` in the root (see README for structure).

### 2. Set Environment Variables
Add your AI key to `.env`.

### 3. Configure Firestore Rules
In Firebase Console → Firestore → Security tab, paste the rules from `firestore.rules`.

### 4. Run Locally
```bash
npm install
npm run dev
```

---

## 👨‍💻 Author

**Sahil Raj (SR24+)**
- GitHub: [@sahil24raj](https://github.com/sahil24raj)

---

## 📄 License

MIT License — free to use and optimize.

<div align="center">

**Built with ❤️ by SR24+**

*"AI that analyzes your daily decisions, emotions & patterns to improve your life."*

</div>
