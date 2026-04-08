import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

// Load environment variables (.env.local)
dotenv.config({ path: ".env.local" });

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Groq AI
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.log("GROQ_API_KEY not set, AI features will be disabled");
}

// 2. POST /api/chats — Stateless AI reply
app.post("/api/chats", async (req, res) => {
    const { role, text, language, history = [] } = req.body;
    console.log("📨 API Request /api/chats Body:", { role, text, language });

    if (!role || !text) {
        return res.status(400).json({ error: "Missing required properties (role, text)" });
    }

    try {
        // Only generate AI reply when role is 'user'
        if (role !== "user") {
            return res.json({ success: true, message: "Handled" });
        }

        // Map local labels to English text for AI processing
        const languageMap = {
            "English": "English",
            "हिंदी": "Hindi",
            "मराठी": "Marathi",
            "ગુજરાતી": "Gujarati"
        };
        const targetLanguage = languageMap[language] || language || "English";

        // Call Groq AI
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
Even if the user writes in a different language, you **MUST IGNORE IT** and respond entirely in **${targetLanguage}**. DO NOT continue speaking the previous language! Switch to **${targetLanguage}** right now for this response.

Format your answers with ChatGPT style guidelines:
- Use clear headers (##, ###) with relevant emojis (e.g., 🏥, 🥗, 💪).
- Use **bold text** for emphasizing key actions.
- Use natural emojis generously inside sentences.
Always include a disclaimer for severe pain setups.`
                    },
                    // Pass provided chat history
                    ...history.map((m) => ({
                        role: m.role === "assistant" ? "assistant" : "user",
                        content: m.text,
                    })),
                    { role: "user", content: text }
                ],
            });

            aiReply = aiResponse.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";
        }

        res.json({
            success: true,
            aiReply: aiReply,
        });

    } catch (error) {
        console.error("❌ Error in chat endpoint:", error);
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});