# SR24+ Reality Checker — AI Behavioral Intelligence Engine

<div align="center">

![SR24+ Reality Checker](https://img.shields.io/badge/SR24%2B-Reality%20Checker-00f3ff?style=for-the-badge&labelColor=0a0a0f)
![Version](https://img.shields.io/badge/Version-3.1-blueviolet?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)
![Firebase](https://img.shields.io/badge/Database-Firebase-orange?style=for-the-badge&logo=firebase)

**An advanced AI-powered life coaching engine that tracks your daily decisions, detects behavioral patterns, builds a psychological profile, and delivers actionable recovery plans.**

[🚀 Live Demo](https://sr24plus-reality-checker.vercel.app) • [📖 Documentation](#-how-it-works) • [⚙️ Setup](#-setup--installation)

</div>

---

## 🧠 What is SR24+ Reality Checker?

SR24+ Reality Checker is a **personal AI behavioral intelligence engine** — not just a journaling app, but a strict AI life coach that:

- **Tracks** your daily logs, moods, and decisions over time
- **Detects** triggers, patterns, and emotional cycles
- **Generates** a full 12-step psychological analysis
- **Builds** a long-term personality profile from your entries
- **Provides** brutal honesty + actionable recovery plans

> Think of it as a therapist + productivity coach + behavioral analyst — all in one, powered by AI.

---

## ✨ Features

### 🔍 12-Step AI Behavioral Analysis
Every scan generates a full behavioral report:

| # | Module | What it gives you |
|---|--------|-------------------|
| 1 | **Core State Analysis** | Emotional state, mental energy, focus & discipline levels |
| 2 | **Reality Score Breakdown** | Discipline, Focus, Consistency & Mental Stability scores (0–100) |
| 3 | **Trigger Detection** | Identifies what caused your mood/behavior shift |
| 4 | **Timeline Analysis** | Your behavioral trend over past logs |
| 5 | **Personality Profile** | AI-built psychological traits from your entries |
| 6 | **Behavior Pattern** | Recurring habits detected over time |
| 7 | **Future Prediction** | What happens if this pattern continues |
| 8 | **Recovery Protocol** | Step-by-step immediate recovery actions |
| 9 | **Action Plan** | Concrete next steps tailored to your situation |
| 10 | **Goal Alignment** | How aligned your behavior is with your long-term goal |
| 11 | **AI Coach Message** | Direct message from your AI life coach |
| 12 | **Brutal Reality Check** | Harsh but honest truth about your current state |

### 📊 Dashboard Intelligence
- **Neural Balance Chart** — Right vs Wrong decisions visualized
- **Reality Score Timeline** — Track your score over 7 days
- **Behavioral Vector Graph** — Confidence trend over time
- **Decision History** — Timestamped log of all scans with full analysis

### 👤 Profile & Goal Tracking
- Set your **Long-Term Goal** (e.g., "Get a software job", "Build a startup")
- AI uses your goal to evaluate every scan for **goal alignment**
- **Personality Profile** builds up from multiple scans over time

### 🔐 Secure & Private
- Google Sign-In via Firebase Authentication
- All data stored in your **private Firestore vault** — no one else can access it
- Firestore Security Rules enforce strict ownership checks

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

| Provider | Env Variable | Model | Free Limit | Best For |
|----------|-------------|-------|-----------|----------|
| **Groq** ⭐ Recommended | `GROQ_API_KEY` | Llama 3.3 70B | 14,400 req/day FREE | Speed + Quality |
| **xAI Grok** | `GROK_API_KEY` | grok-3-mini | $25 free credits | Quality |
| **Google Gemini** | `GEMINI_API_KEY` | gemini-2.0-flash | 1,500 req/day FREE | Fallback |

**Priority:** `GROQ_API_KEY` → `GROK_API_KEY` → `GEMINI_API_KEY`

Only one needs to be set. The app automatically uses whichever key is available.

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- A Firebase project
- An API key from [Groq](https://console.groq.com) (free), [xAI](https://console.x.ai), or [Google AI Studio](https://aistudio.google.com)

### 1. Clone the Repository
```bash
git clone https://github.com/sahil24raj/SR24plus-reality-checker.git
cd SR24plus-reality-checker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Firebase
Create a `firebase-applet-config.json` in the root:
```json
{
  "projectId": "your-project-id",
  "appId": "your-app-id",
  "apiKey": "your-firebase-api-key",
  "authDomain": "your-project.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "your-project.firebasestorage.app",
  "messagingSenderId": "your-sender-id"
}
```

### 4. Set Environment Variables
Create a `.env` file:
```env
# Use ONE of these (Groq is recommended — free & fast)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
# GROK_API_KEY=xai-xxxxxxxxxxxxxxxxxxxx
# GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx
```

### 5. Configure Firestore Rules
In Firebase Console → Firestore → Security tab, paste:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    function isValidScan(data) {
      return data.uid == request.auth.uid &&
             data.input is string &&
             data.confidence is number &&
             data.tone is string &&
             data.behavior is string &&
             data.decisionQuality is string &&
             data.sentiment is string;
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      match /scans/{scanId} {
        allow read: if isOwner(userId);
        allow create, update: if isOwner(userId) && isValidScan(request.resource.data);
        allow delete: if isOwner(userId);
      }
      match /{sub}/{doc} {
        allow read, write: if isOwner(userId);
      }
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 6. Run Locally
```bash
npm run dev
```
App opens at `http://localhost:3000`

---

## 🚀 Deploy to Vercel

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add Environment Variables in Vercel → Project Settings → Environment Variables:
   - `GROQ_API_KEY` = your Groq key
4. Add your Vercel domain to Firebase Console → Authentication → Authorized Domains
5. Deploy!

---

## 📁 Project Structure

```
sr24+-reality-checker/
├── src/
│   ├── App.tsx               # Main app — all UI components & logic
│   ├── types.ts              # TypeScript interfaces (AnalysisResult, etc.)
│   ├── firebase.ts           # Firebase init, auth helpers
│   ├── services/
│   │   └── geminiService.ts  # AI engine — Groq/Grok/Gemini multi-provider
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── index.css             # Neural UI design system
│   └── main.tsx              # Entry point
├── firestore.rules           # Firestore security rules
├── firebase-applet-config.json
├── vite.config.ts
└── package.json
```

---

## 🎨 UI Design

- **Theme:** Dark Neural Interface (deep blacks + neon cyan/purple/green)
- **Typography:** System mono + bold italic display fonts
- **Animations:** Framer Motion smooth transitions
- **Effects:** Glassmorphism cards, animated neural particle background
- **Layout:** Mobile-responsive bottom navigation

---

## 🔒 Privacy & Security

- All scan data is **end-to-end owned by the user** via Firebase Auth UID
- Firestore rules **enforce strict ownership** — no user can read another's data
- No data is shared with third parties
- API keys are stored securely in Vercel environment variables (never in code)

---

## 📝 How to Use

1. **Sign in** with your Google account
2. Go to **New Scan** → write your daily log (what you did, how you felt, decisions made)
3. Click **Execute Scan** → AI analyzes in ~3 seconds
4. View your **12-step behavioral report** — scores, triggers, action plan
5. Check **Dashboard** for trends and patterns over time
6. Set your **Long-Term Goal** in Profile → AI aligns every scan with it
7. Build your **Personality Profile** over multiple scans

---

## 👨‍💻 Author

**Sahil Raj (SR24+)**
- GitHub: [@sahil24raj](https://github.com/sahil24raj)

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ by SR24+**

*"AI that analyzes your daily decisions, emotions & patterns to improve your life."*

</div>
