import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import admin from "firebase-admin";
import Groq from "groq-sdk";
import fs from "fs";

// Load environment variables (.env.local)
dotenv.config({ path: ".env.local" });

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Firebase Admin SDK using Service Account
let adminInitialized = false;
try {
  const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  adminInitialized = true;
} catch (error) {
  console.log("Firebase not configured, skipping Firebase initialization");
}

// 2. Initialize Neon Postgres Connection
let sql = null;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
  sql = neon(process.env.DATABASE_URL);
} else {
  console.log("DATABASE_URL not set, skipping database initialization");
}

// 3. Initialize Groq AI
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.log("GROQ_API_KEY not set, skipping Groq initialization");
}

// 4. Auto-Create tables if they do not exist
const initDB = async () => {
    if (!sql) return;
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                text TEXT NOT NULL,
                recommendations JSONB DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await sql`
            CREATE TABLE IF NOT EXISTS user_profiles (
                user_id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                role VARCHAR(50),
                age VARCHAR(10),
                gender VARCHAR(10),
                weight VARCHAR(10),
                height VARCHAR(10),
                specialization TEXT,
                credentials TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        console.log("✅ Neon Postgres Initialized & Tables Verified!");
    } catch (error) {
        console.error("❌ Database Initialization Error:", error);
    }
};
initDB();

// 5. API Endpoints - User Profiles (unchanged)
app.get("/api/user/profile", async (req, res) => {
    if (!adminInitialized || !sql) return res.status(503).json({ error: "Service not configured" });
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const profile = await sql`SELECT * FROM user_profiles WHERE user_id = ${userId}`;
        res.json({ success: true, exists: profile.length > 0, data: profile[0] });
    } catch (error) {
        res.status(401).json({ error: "Unauthorized or DB Error" });
    }
});

app.post("/api/user/profile", async (req, res) => {
    if (!adminInitialized || !sql) return res.status(503).json({ error: "Service not configured" });
    const { token, profileData } = req.body;
    if (!token || !profileData) return res.status(400).json({ error: "Missing args" });

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        await sql`
            INSERT INTO user_profiles (user_id, name, email, role, age, gender, weight, height, specialization, credentials)
            VALUES (
                ${userId}, 
                ${profileData.name || null}, 
                ${profileData.email || null}, 
                ${profileData.role || null}, 
                ${profileData.age || null}, 
                ${profileData.gender || null}, 
                ${profileData.weight || null}, 
                ${profileData.height || null}, 
                ${profileData.specialization || null}, 
                ${profileData.credentials || null}
            )
            ON CONFLICT (user_id) DO UPDATE SET
                role = EXCLUDED.role,
                age = EXCLUDED.age,
                gender = EXCLUDED.gender,
                weight = EXCLUDED.weight,
                height = EXCLUDED.height,
                specialization = EXCLUDED.specialization,
                credentials = EXCLUDED.credentials
        `;

        res.json({ success: true, message: "Profile Saved!" });
    } catch (error) {
        console.error("❌ Profile save error:", error);
        res.status(500).json({ error: "Failed to save profile on DB" });
    }
});

// 6. POST /api/chats — Save user message AND get AI reply
// This is the main chat endpoint your frontend calls
app.post("/api/chats", async (req, res) => {
    const { token, role, text, language, recommendations } = req.body;
    console.log("📨 API Request /api/chats Body:", { role, text, language });

    if (!role || !text) {
        return res.status(400).json({ error: "Missing required properties (role, text)" });
    }

    let userId = "anonymous";
    if (adminInitialized && token) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            userId = decodedToken.uid;
        } catch (error) {
            return res.status(401).json({ error: "Unauthorized" });
        }
    }

    try {
        // Save the user's message to Neon if sql available
        if (sql) {
            await sql`
                INSERT INTO chat_messages (user_id, role, text, recommendations)
                VALUES (${userId}, ${role}, ${text}, ${JSON.stringify(recommendations || [])})
            `;
        }

        // Only generate AI reply when role is 'user' (not when saving assistant messages)
        if (role !== "user") {
            return res.json({ success: true, message: "Message saved!" });
        }

        let history = [];
        if (sql) {
            // Fetch last 20 messages for this user to use as AI context
            history = await sql`
                SELECT role, text FROM chat_messages
                WHERE user_id = ${userId}
                ORDER BY created_at ASC
                LIMIT 20
            `;
        }

        console.log("📜 Chat History context:", history);

        // Map local labels to English text for AI processing
        const languageMap = {
            "English": "English",
            "हिंदी": "Hindi",
            "मराठी": "Marathi",
            "ગુજરાતી": "Gujarati"
        };
        const targetLanguage = languageMap[language] || language || "English";

        // Call Groq AI with full chat history as context
        let aiReply = "AI not configured. Please set up GROQ_API_KEY.";
        if (groq) {
            const aiResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                max_tokens: 1024,
                messages: [
                    {
                        role: "system",
                        content: `You are Prism AI, a professional, empathetic, and knowledgeable physiotherapy assistant for Prism Health Hub. 

🚨 **CRITICAL RULE**: 
The user has selected the language: **${targetLanguage}**. 
You MUST write 100% of your answer in the **${targetLanguage} language and its native script**. 
Even if the user writes in a different language, or if previous messages inside the history log context are in Hindi/Marathi, you **MUST IGNORE IT** and respond entirely in **${targetLanguage}**. DO NOT continue speaking the previous language! Switch to **${targetLanguage}** right now for this response.

Format your answers with ChatGPT style guidelines:
- Use clear headers (##, ###) with relevant emojis (e.g., 🏥, 🥗, 💪).
- Use **bold text** for emphasizing key actions.
- Use natural emojis generously inside sentences.
Always include a disclaimer for severe pain setups.`
                    },
                    // Pass full conversation history so AI remembers context
                    ...history.map((m) => ({
                        role: m.role === "assistant" ? "assistant" : "user",
                        content: m.text,
                    })),
                ],
            });

            aiReply = aiResponse.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";
        }

        // console.log("🤖 Groq AI Reply received:", aiReply);

        // Save the AI reply to Neon as well if sql available
        if (sql) {
            await sql`
                INSERT INTO chat_messages (user_id, role, text, recommendations)
                VALUES (${userId}, 'assistant', ${aiReply}, '[]')
            `;
        }

        // Return the AI reply to frontend
        res.json({
            success: true,
            message: "Chat saved!",
            aiReply: aiReply,
        });

    } catch (error) {
        console.error("❌ Error in chat endpoint:");
        console.error("  Error name:", error?.name);
        console.error("  Error message:", error?.message);
        console.error("  Error code:", error?.code || error?.codePrefix);
        console.error("  Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

// 7. GET /api/chats — Fetch all chats for logged-in user (unchanged)
app.get("/api/chats", async (req, res) => {
    if (!adminInitialized || !sql) return res.status(503).json({ error: "Service not configured" });
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing Token" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const chats = await sql`
            SELECT role, text, recommendations, created_at 
            FROM chat_messages 
            WHERE user_id = ${userId} 
            ORDER BY created_at ASC
        `;

        res.json({ success: true, data: chats });
    } catch (error) {
        console.error("❌ Error fetching chats:", error);
        res.status(401).json({ error: "Unauthorized or Database Error" });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});