# 🖥️ Frontend Documentation

The PRISM frontend is built using a modern, high-performance stack designed for responsiveness and visual excellence.

## 🛠️ Tech Stack
- **Framework:** [React 18](https://reactjs.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + [Shadcn UI](https://ui.shadcn.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📂 Structure
- `/src/components`: Reusable UI components (Buttons, Cards, Modals).
- `/src/pages`: Main view components (Dashboard, Tracker, Posture, etc.).
- `/src/hooks`: Custom React hooks for state management.
- `/src/lib`: Utility functions and third-party configurations.

## 🔌 API Integration
The frontend communicates with three separate backend services through a Vite proxy:
- `/api`: Routes to the Node.js Backend (Port 4000).
- `/api-posture`: Routes to the Posture AI Service (Port 5000).
- `/api-exercise`: Routes to the Exercise AI Service (Port 5001).

## 🚀 Running Locally
```bash
npm run dev
```
By default, the frontend runs on **Port 8080**.
