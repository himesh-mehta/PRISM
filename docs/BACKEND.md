# ⚙️ Backend Documentation

The PRISM backend handles central logic, user authentication, and data persistence.

## 🛠️ Tech Stack
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express](https://expressjs.com/)
- **Database:** [Neon PostgreSQL](https://neon.tech/) (Serverless)
- **Authentication:** Bcrypt.js for password hashing.
- **AI SDK:** Groq SDK for LLM integration.

## 🔑 Core Responsibilities
1.  **User Authentication**: Secure Signup/Login flow.
2.  **Profile Management**: Storing and retrieving user health metrics (BMI, age, weight).
3.  **AI Assistant**: Proxying chat requests to Groq (Llama-3.3) for health advice.
4.  **Reporting**: Central repository for Posture and Exercise session data.

## 📡 API Endpoints
- `POST /api/signup`: Register new users.
- `POST /api/login`: Authenticate users and return profiles.
- `POST /api/chats`: Interface with the AI assistant.
- `POST /api/posture-report`: Save detailed postural analysis results.
- `POST /api/exercise-report`: Save workout statistics.

## 🚀 Running Locally
```bash
node backend/server.js
```
The backend runs on **Port 4000**.
