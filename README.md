# 🎯 Focus Analyzer AI

A full-stack productivity tool that uses **Machine Learning** to detect user distraction and **Gemini AI** to provide real-time behavioral coaching.

## 🚀 Key Features
- **Real-time ML Analysis:** Classified focus levels via Scikit-Learn.
- **Contextual AI Coaching:** Integrated Gemini 2.5 Flash for personalized tips.
- **Smart Notification System:** Browser-level alerts for prolonged distraction.
- **Session History:** Persistence of performance data via LocalStorage.

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **ML Service:** Python, FastAPI, Scikit-Learn
- **AI Integration:** Google Generative AI (Gemini)

## 📡 Architecture
1. **React Client** captures behavioral data.
2. **FastAPI ML Server** predicts current state (0/1).
3. **Node.js Server** requests context-aware advice from Gemini based on state.
4. **CORS & Stealth Headers** ensure secure, bypass-protected communication.