import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log("GROQ_API_KEY loaded:", process.env.GROQ_API_KEY ? "YES (length: " + process.env.GROQ_API_KEY.length + ")" : "NO");
console.log("DATABASE_URL loaded:", process.env.DATABASE_URL ? "YES" : "NO");

// Test Groq API
try {
  console.log("\n--- Testing Groq API ---");
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 50,
    messages: [
      { role: "system", content: "Reply with 'Hello, Groq works!'" },
      { role: "user", content: "test" }
    ]
  });
  console.log("Groq API response:", response.choices[0]?.message?.content);
  console.log("✅ Groq API works!");
} catch (err) {
  console.error("❌ Groq API error:", err.message);
  console.error("Full error:", JSON.stringify(err, null, 2));
}

// Test Neon DB
try {
  console.log("\n--- Testing Neon DB ---");
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT NOW()`;
  console.log("DB response:", result);
  console.log("✅ Neon DB works!");
} catch (err) {
  console.error("❌ Neon DB error:", err.message);
}
