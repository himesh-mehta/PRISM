import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// Get the patient_id
const patients = await sql`SELECT id FROM patients LIMIT 1`;
if (patients.length === 0) { console.log("No patients found"); process.exit(0); }
const patientId = patients[0].id;
console.log("Patient ID:", patientId);

// Call the endpoint
const res = await fetch(`http://localhost:4000/api/posture-history?patientId=${patientId}`);
const data = await res.json();
console.log("Success:", data.success);
console.log("Sessions count:", data.sessions?.length);
if (data.sessions?.length > 0) {
  const s = data.sessions[0];
  console.log("First session:", { id: s.id, score: s.overall_score, date: s.finished_at });
  console.log("Has report_data:", !!s.report_data);
  if (s.report_data) {
    const rd = typeof s.report_data === 'string' ? JSON.parse(s.report_data) : s.report_data;
    console.log("report_data keys:", Object.keys(rd));
    console.log("overall:", rd.overall, "metrics:", rd.metrics?.length, "findings:", rd.findings?.length);
  }
}
