import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

console.log("DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 80) + "..." : "NOT SET");

try {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql`SELECT 1 as test`;
  console.log("✅ Database connection works:", result);
} catch (err) {
  console.error("❌ Database connection failed!");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  console.error("Source error:", err.sourceError?.message);
}
