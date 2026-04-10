import fetch from 'node-fetch'; // or built-in fetch in Node 18+
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const NEON_API_URL = process.env.NEON_API_URL;
const NEON_API_KEY = process.env.NEON_API_KEY;

console.log("Testing Neon Data API...");
console.log("URL:", NEON_API_URL);

async function testConnection() {
  if (!NEON_API_URL) {
    console.error("❌ NEON_API_URL is missing in .env.local");
    return;
  }

  try {
    const response = await fetch(NEON_API_URL, {
      method: "GET",
      headers: {
        "Authorization": NEON_API_KEY ? `Bearer ${NEON_API_KEY}` : "",
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Successfully connected to Neon Data API!");
      console.log("Response:", JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error(`❌ Connection failed with status ${response.status}: ${errorText}`);
      if (response.status === 401) {
        console.error("💡 Tip: This typically means you need a valid JWT token in NEON_API_KEY.");
      }
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

testConnection();
