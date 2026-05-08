// Test the live /api/posture-report and /api/exercise-report HTTP endpoints on port 4000
const BASE = "http://localhost:4000";

// Get a real user_id from our DB to test with
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

const users = await sql`SELECT user_id, email FROM user_auth LIMIT 1`;
const userId = users[0].user_id;
console.log("Using user_id:", userId);

// ── Test posture-report (no patient_id — server should auto-resolve) ──
console.log("\n--- POST /api/posture-report ---");
const postureRes = await fetch(`${BASE}/api/posture-report`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId,
    results: {
      overall: 82,
      metrics: [{ name: "Head Tilt", score: 88, view: "FRONT", status: "good" }],
      findings: [{ title: "Good alignment", details: ["Keep it up!"], score: 88, color: "green", status: "good" }]
    }
  })
});
const postureData = await postureRes.json();
console.log("STATUS:", postureRes.status, JSON.stringify(postureData));

// ── Test exercise-report ──────────────────────────────────────────────
console.log("\n--- POST /api/exercise-report ---");
const exerciseRes = await fetch(`${BASE}/api/exercise-report`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId, exercise: "squats", reps: 15, formScore: 91, duration: 60 })
});
const exerciseData = await exerciseRes.json();
console.log("STATUS:", exerciseRes.status, JSON.stringify(exerciseData));

// ── Verify ────────────────────────────────────────────────────────────
console.log("\n--- Final DB counts ---");
const counts = await sql`
  SELECT 
    (SELECT COUNT(*) FROM posture_sessions) as sessions,
    (SELECT COUNT(*) FROM posture_metrics)  as metrics,
    (SELECT COUNT(*) FROM posture_findings) as findings,
    (SELECT COUNT(*) FROM reports)          as reports,
    (SELECT COUNT(*) FROM health_metrics)   as health_metrics,
    (SELECT COUNT(*) FROM patients)         as patients
`;
console.log(JSON.stringify(counts[0], null, 2));
