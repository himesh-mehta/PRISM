// Direct test: simulate exactly what the frontend sends to /api/posture-report and /api/exercise-report
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

// Use the first known user_id from user_auth
const users = await sql`SELECT user_id, email FROM user_auth LIMIT 1`;
const userId = users[0].user_id;
console.log("Testing with user_id:", userId, "email:", users[0].email);

// ── TEST 1: posture-report endpoint ──────────────────────────────
console.log("\n--- Testing posture-report ---");
const mockResults = {
  overall: 78,
  metrics: [
    { name: "Head Tilt", score: 85, view: "FRONT", status: "good" },
    { name: "Shoulder Level", score: 70, view: "FRONT", status: "warning" }
  ],
  findings: [
    { title: "Slight forward head posture", details: ["Strengthen neck muscles", "Chin tucks daily"], score: 65, color: "amber", status: "warning" }
  ]
};

try {
  const sessionResult = await sql`
    INSERT INTO posture_sessions (patient_id, status, overall_score, finished_at, model_version)
    VALUES (${userId}, 'completed', ${mockResults.overall}, NOW(), 'pose_landmarker_heavy')
    RETURNING id
  `;
  const sessionId = sessionResult[0].id;
  console.log("✅ Session created:", sessionId);

  for (const m of mockResults.metrics) {
    await sql`
      INSERT INTO posture_metrics (session_id, metric_name, metric_score, metric_view, metric_status)
      VALUES (${sessionId}, ${m.name}, ${m.score}, ${m.view}, ${m.status})
    `;
  }
  console.log("✅ Metrics saved:", mockResults.metrics.length);

  for (const f of mockResults.findings) {
    await sql`
      INSERT INTO posture_findings (session_id, title, details, score, color, status)
      VALUES (${sessionId}, ${f.title}, ${JSON.stringify(f.details)}, ${f.score}, ${f.color}, ${f.status})
    `;
  }
  console.log("✅ Findings saved:", mockResults.findings.length);

  await sql`
    INSERT INTO reports (patient_id, session_id, report_data)
    VALUES (${userId}, ${sessionId}, ${JSON.stringify(mockResults)})
  `;
  console.log("✅ Report blob saved");
} catch (e) {
  console.error("❌ posture-report error:", e.message);
}

// ── TEST 2: exercise-report endpoint ────────────────────────────
console.log("\n--- Testing exercise-report ---");
try {
  await sql`
    INSERT INTO health_metrics (user_id, metric_type, metric_value)
    VALUES
      (${userId}, ${'exercise_reps_squats'}, ${10}),
      (${userId}, ${'exercise_score_squats'}, ${88}),
      (${userId}, ${'exercise_duration_squats'}, ${45})
  `;
  console.log("✅ Exercise metrics saved");
} catch (e) {
  console.error("❌ exercise-report error:", e.message);
}

// ── Verify counts ─────────────────────────────────────────────
console.log("\n--- Final counts ---");
const counts = await sql`
  SELECT 
    (SELECT COUNT(*) FROM posture_sessions) as sessions,
    (SELECT COUNT(*) FROM posture_metrics) as metrics,
    (SELECT COUNT(*) FROM posture_findings) as findings,
    (SELECT COUNT(*) FROM reports) as reports,
    (SELECT COUNT(*) FROM health_metrics) as health_metrics
`;
console.log(JSON.stringify(counts[0], null, 2));
