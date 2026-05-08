<div align="center">

<img src="src/assets/human-ai-bg.png" alt="PRISM Logo" width="120" style="border-radius: 20px;"/>

# 🔷 PRISM
### AI-Powered Physiotherapy & Rehabilitation Platform

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow?style=flat-square&logo=python)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)

> Real-time posture analysis, AI-guided exercise tracking, and intelligent physiotherapy assistance — all in one platform.

[**Live Demo**](https://prism.vercel.app) · [**Report Bug**](https://github.com/your-repo/issues) · [**Request Feature**](https://github.com/your-repo/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Services](#-running-the-services)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🧠 Overview

**PRISM** is a full-stack AI physiotherapy platform built for patients and doctors. It uses computer vision to analyze posture across 4 body views, tracks exercise repetitions in real-time with form feedback, and provides a Groq-powered AI chatbot for personalized physiotherapy guidance.

The system is architected as **4 independent microservices**:

| Service | Stack | Port |
|---|---|---|
| Frontend | React + Vite + TypeScript | `8080` |
| Backend API | Node.js + Express | `4000` |
| Posture AI | Python + Flask + MediaPipe | `5000` |
| Exercise AI | Python + Flask + MediaPipe | `5001` |

---

## ✨ Features

- 🧍 **Posture Analysis** — 4-view (Front/Right/Back/Left) body scan using MediaPipe's 33-point pose landmark model
- 🏋️ **Exercise Tracker** — Real-time rep counting and form scoring for squats, push-ups, curls, yoga, and more
- 🤖 **AI Chatbot** — Groq-powered physiotherapy assistant with multilingual support (English, Hindi, Marathi, Gujarati)
- 👨‍⚕️ **Doctor Dashboard** — Patient management, prescription builder, and clinical session history
- 📊 **Reports & Analytics** — Session history with postural score breakdowns and exercise metrics
- 🔐 **Auth System** — Role-based authentication (Patient / Doctor) backed by Neon PostgreSQL
- 🌙 **Dark Mode** — System-aware theme with smooth transitions

---

## 🛠️ Tech Stack

**Frontend**
- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev) — build tool & dev server
- [Tailwind CSS](https://tailwindcss.com) + [Shadcn-UI](https://ui.shadcn.com) — styling
- [Framer Motion](https://www.framer.com/motion/) — animations

**Backend**
- [Node.js](https://nodejs.org) + [Express](https://expressjs.com) — REST API
- [Neon PostgreSQL](https://neon.tech) — serverless database
- [Groq SDK](https://console.groq.com) — LLM inference (Llama 3)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) — password hashing

**AI Services**
- [Python 3.10+](https://python.org)
- [MediaPipe](https://developers.google.com/mediapipe) — `pose_landmarker_heavy.task` (33 landmarks)
- [OpenCV](https://opencv.org) — webcam capture & frame annotation
- [Flask](https://flask.palletsprojects.com) + [flask-cors](https://flask-cors.readthedocs.io)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User's Browser                    │
│                                                     │
│  React Frontend (Vercel / localhost:8080)           │
│       │                │              │             │
│  /api/*          /api-posture/*  /api-exercise/*   │
└───┼──────────────────┼──────────────┼──────────────┘
    │                  │              │
    ▼                  ▼              ▼
Node.js API       Flask :5000     Flask :5001
(Railway/4000)   [Local Only]    [Local Only]
    │             Webcam          Webcam
    ▼
Neon PostgreSQL + Groq AI
```

> ⚠️ **The Python AI services require a physical webcam.** They always run on the user's local machine and cannot be deployed to a cloud server.

---

## 📦 Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.10+ | [python.org](https://python.org) |
| Git | Any | [git-scm.com](https://git-scm.com) |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/PRISM.git
cd PRISM
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
# Copy the template
cp .env.example .env.local

# Open .env.local and fill in your keys
```

See [Environment Variables](#-environment-variables) for details.

### 5. Start All Services

```bash
npm run start:all
```

This launches all 4 services simultaneously using `concurrently`.

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:4000 |
| Posture AI | http://localhost:5000 |
| Exercise AI | http://localhost:5001 |

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root (copy from `.env.example`):

```env
# ── Neon PostgreSQL ─────────────────────────────
# Get from: https://neon.tech/dashboard
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require

# ── Groq AI (LLM Chatbot) ───────────────────────
# Get from: https://console.groq.com
GROQ_API_KEY=gsk_your_key_here

# ── Production Only ─────────────────────────────
# Set this in Vercel when deploying the frontend
# VITE_API_BASE=https://your-backend.railway.app
```

> 🔒 **Never commit `.env.local` to Git.** It is already in `.gitignore`.

---

## ▶️ Running the Services

### All at once (recommended)
```bash
npm run start:all
```

### Individually

```bash
# Frontend (React + Vite)
npm run dev

# Backend (Node.js API)
node backend/server.js

# Posture AI Service
python services/posture/main.py

# Exercise AI Service
python services/exercise/main.py
```

---

## 📁 Project Structure

```
PRISM/
├── 📁 backend/
│   └── server.js              # Express API (auth, DB, AI)
│
├── 📁 services/
│   ├── pose_landmarker_heavy.task  # Shared MediaPipe model
│   ├── 📁 posture/
│   │   ├── main.py            # Posture analysis service
│   │   └── requirements.txt
│   └── 📁 exercise/
│       ├── main.py            # Exercise tracking service
│       └── requirements.txt
│
├── 📁 src/                    # React frontend
│   ├── 📁 components/         # Reusable UI components
│   ├── 📁 contexts/           # React context (Auth)
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 lib/
│   │   ├── api.ts             # API base URL utility
│   │   └── utils.ts
│   └── 📁 pages/              # Route-level page components
│       └── 📁 doctor/         # Doctor-role pages
│
├── 📁 docs/                   # Service documentation
│   ├── FRONTEND.md
│   ├── BACKEND.md
│   ├── POSTURE_SERVICE.md
│   └── EXERCISE_SERVICE.md
│
├── 📁 scripts/db/             # Database migration scripts
├── .env.example               # Environment variable template
├── .env.local                 # Your secrets (do not commit)
├── .gitignore
├── package.json
├── requirements.txt           # Python dependencies
├── vite.config.ts
└── README.md
```

---

## 🌐 Deployment

### Frontend → Vercel

1. Import repo at [vercel.com](https://vercel.com)
2. Framework: **Vite** | Build: `npm run build` | Output: `dist`
3. Set environment variable: `VITE_API_BASE=https://your-backend.railway.app`

### Backend → Railway

1. New project at [railway.app](https://railway.app) → Deploy from GitHub
2. Start command: `node backend/server.js`
3. Set environment variables: `DATABASE_URL` and `GROQ_API_KEY`

### Python AI Services

> These **cannot** be deployed to cloud servers — they require webcam hardware. Users must run them locally.

For detailed deployment steps, see the [Deployment Guide](docs/BACKEND.md).

---

## 📖 Documentation

| Document | Description |
|---|---|
| [FRONTEND.md](docs/FRONTEND.md) | React app, routing, Vite proxy config |
| [BACKEND.md](docs/BACKEND.md) | Express API routes, database schema |
| [POSTURE_SERVICE.md](docs/POSTURE_SERVICE.md) | Posture AI endpoints and logic |
| [EXERCISE_SERVICE.md](docs/EXERCISE_SERVICE.md) | Exercise tracker endpoints and logic |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by the PRISM Team

</div>
