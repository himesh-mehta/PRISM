import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config(); 


const app = express();
app.use(cors({
  origin: ['https://prism-mu-five.vercel.app', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());

if (!process.env.DATABASE_URL) console.error("❌ DATABASE_URL missing");
const sql = neon(process.env.DATABASE_URL);

let groq = null;
if (process.env.GROQ_API_KEY?.trim()) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.log("GROQ_API_KEY not set — AI disabled");
}

// ── Helper: get/create users.id + patient_id for a user_auth record ──────────
async function resolveUserIds(userAuthId, email, role, gender) {
    // 1. Get or create a users.id (the "central" identity FK source)
    let usersId = null;
    const usersRows = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (usersRows.length > 0) {
        usersId = usersRows[0].id;
    } else {
        const newUser = await sql`
            INSERT INTO users (email, name, role)
            VALUES (${email}, ${email.split('@')[0]}, ${role || 'patient'})
            RETURNING id
        `;
        usersId = newUser[0].id;
        console.log("👤 Auto-created users record:", usersId);
    }

    // 2. Get or create patients.id (only for patient role)
    let patientId = null;
    if ((role || 'patient') === 'patient') {
        const patientRows = await sql`SELECT id FROM patients WHERE user_id = ${usersId} LIMIT 1`;
        if (patientRows.length > 0) {
            patientId = patientRows[0].id;
        } else {
            const patientCode = 'P' + Date.now().toString().slice(-8);
            const newPatient = await sql`
                INSERT INTO patients (user_id, patient_code, gender)
                VALUES (${usersId}, ${patientCode}, ${gender || null})
                RETURNING id
            `;
            patientId = newPatient[0].id;
            console.log("🪪 Auto-created patient record:", patientId);
        }
    }

    // 3. Get doctor_id (only for doctor role)
    let doctorId = null;
    if (role === 'doctor') {
        const doctorRows = await sql`SELECT id FROM doctors WHERE user_id = ${usersId} LIMIT 1`;
        if (doctorRows.length > 0) {
            doctorId = doctorRows[0].id;
        }
    }

    return { usersId, patientId, doctorId };
}

// ── 1. POST /api/chats — AI reply ────────────────────────────────────────────
app.post("/api/chats", async (req, res) => {
    const { role, text, language, history = [] } = req.body;
    if (!role || !text) return res.status(400).json({ error: "Missing role or text" });
    try {
        if (role !== "user") return res.json({ success: true });
        const langMap = { "English": "English", "हिंदी": "Hindi", "मराठी": "Marathi", "ગુજરાતી": "Gujarati" };
        const targetLanguage = langMap[language] || language || "English";
        let aiReply = "AI not configured.";
        if (groq) {
            console.log("🤖 [AI] Sending request to Groq for language:", targetLanguage);
            try {
                const resp = await groq.chat.completions.create({
                    model: "llama-3.1-70b-versatile",
                    max_tokens: 1024,
                    messages: [
                        { role: "system", content: `You are Prism AI, a professional physiotherapy assistant for Prism Health Hub.\n\n🚨 CRITICAL: Respond 100% in ${targetLanguage} native script.\n\nUse headers (##, ###) with emojis, bold key actions, natural emojis. Always add a disclaimer for severe pain.` },
                        ...history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
                        { role: "user", content: text }
                    ],
                });
                aiReply = resp.choices[0]?.message?.content ?? "Sorry, no response.";
                console.log("✅ [AI] Successfully got reply");
            } catch (groqErr) {
                console.error("❌ [AI] Groq API Error:", groqErr.message);
                aiReply = "I'm having trouble connecting to my brain right now. Please try again in a moment.";
            }
        } else {
            console.warn("⚠️ [AI] Groq client not initialized (check GROQ_API_KEY)");
        }
        res.json({ success: true, aiReply });
    } catch (err) {
        console.error("❌ Chat error:", err);
        res.status(500).json({ error: "Server error." });
    }
});

// ── 2. POST /api/signup — Full signup: users → user_auth → user_profiles → patients/doctors ──
app.post("/api/signup", async (req, res) => {
    const p = req.body;
    console.log("📝 [SIGNUP] Email:", p.email, "Role:", p.role);
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(p.password, salt);

        // a) users table (central identity, FK source for patients)
        const userRow = await sql`
            INSERT INTO users (email, password_hash, name, role, specialization)
            VALUES (${p.email}, ${passwordHash}, ${p.name}, ${p.role || 'patient'}, ${p.specialization || null})
            RETURNING id
        `;
        const usersId = userRow[0].id;
        console.log("👤 users.id:", usersId);

        // b) user_auth (auth table with its own UUID PK)
        const authRow = await sql`
            INSERT INTO user_auth (email, password_hash)
            VALUES (${p.email}, ${passwordHash})
            RETURNING user_id
        `;
        const userId = authRow[0].user_id;

        // c) user_profiles (links to user_auth.user_id)
        const profileRow = await sql`
            INSERT INTO user_profiles (
                user_id, name, email, role, age, gender, weight, height, bmi, body_type, specialization, credentials
            ) VALUES (
                ${userId}, ${p.name}, ${p.email}, ${p.role || 'patient'},
                ${p.age}, ${p.gender}, ${p.weight}, ${p.height},
                ${p.bmi}, ${p.bodyType}, ${p.specialization || null}, ${p.credentials || null}
            ) RETURNING *
        `;

        // d) patients OR doctors (both link to users.id)
        let patientId = null;
        let doctorId = null;

        if ((p.role || 'patient') === 'patient') {
            const patientCode = 'P' + Date.now().toString().slice(-8);
            const patientRow = await sql`
                INSERT INTO patients (user_id, patient_code, gender)
                VALUES (${usersId}, ${patientCode}, ${p.gender || null})
                RETURNING id
            `;
            patientId = patientRow[0].id;
            console.log("🪪 patient_id:", patientId);
        } else if (p.role === 'doctor') {
            const doctorRow = await sql`
                INSERT INTO doctors (user_id, license_number, specialization)
                VALUES (${usersId}, ${p.credentials || null}, ${p.specialization || null})
                RETURNING id
            `;
            doctorId = doctorRow[0].id;
            console.log("🩺 doctor_id:", doctorId);
        }

        res.json({
            success: true,
            user: { ...profileRow[0], user_id: userId, users_id: usersId, patient_id: patientId, doctor_id: doctorId }
        });
    } catch (err) {
        console.error("❌ Signup error:", err);
        res.status(500).json({ error: "Signup failed: " + err.message });
    }
});

// ── 3. POST /api/login — Real DB login returning user_id + patient_id ────────
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing email or password" });
    try {
        const rows = await sql`
            SELECT a.user_id, a.email, a.password_hash,
                   p.name, p.role, p.age, p.gender, p.weight, p.height, p.bmi, p.body_type, p.specialization, p.credentials
            FROM user_auth a LEFT JOIN user_profiles p ON p.user_id = a.user_id
            WHERE a.email = ${email} LIMIT 1
        `;
        if (rows.length === 0) return res.status(401).json({ error: "No account found with this email." });

        const row = rows[0];
        const match = await bcrypt.compare(password, row.password_hash);
        if (!match) return res.status(401).json({ error: "Incorrect password." });

        // Resolve users.id, patient_id, and doctor_id
        const { usersId, patientId, doctorId } = await resolveUserIds(row.user_id, email, row.role, row.gender);

        res.json({
            success: true,
            user: {
                user_id: row.user_id,
                users_id: usersId,
                patient_id: patientId,
                doctor_id: doctorId,
                email: row.email,
                name: row.name || email.split("@")[0],
                role: row.role || "patient",
                age: row.age || 25,
                gender: row.gender || "male",
                weight: parseFloat(row.weight) || 70,
                height: parseFloat(row.height) || 170,
                bmi: parseFloat(row.bmi) || 0,
                bodyType: row.body_type || "Normal",
                specialization: row.specialization,
                credentials: row.credentials,
            }
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ error: "Login failed: " + err.message });
    }
});

// ── 4. POST /api/chat-save — Persist chat message pair to chat_messages ──────
app.post("/api/chat-save", async (req, res) => {
    const { userId, userMessage, assistantReply } = req.body;
    if (!userId || !userMessage || !assistantReply) return res.status(400).json({ error: "Missing fields" });
    try {
        await sql`INSERT INTO chat_messages (user_id, role, text) VALUES (${userId}, 'user', ${userMessage})`;
        await sql`INSERT INTO chat_messages (user_id, role, text) VALUES (${userId}, 'assistant', ${assistantReply})`;
        res.json({ success: true });
    } catch (err) {
        console.error("❌ Chat save error:", err);
        res.status(500).json({ error: "Chat save failed: " + err.message });
    }
});

// ── 5. POST /api/posture-report — Save posture session to Neon ───────────────
app.post("/api/posture-report", async (req, res) => {
    const { userId, usersId: clientUsersId, patientId: clientPatientId, results } = req.body;
    console.log("🧍 [POSTURE SAVE] user_id:", userId, "patient_id:", clientPatientId, "score:", results?.overall);
    if (!results) return res.status(400).json({ error: "Missing results" });

    try {
        let resolvedPatientId = clientPatientId;

        // If no patient_id provided, resolve it from the chain
        if (!resolvedPatientId) {
            if (clientUsersId) {
                // Direct: we have users.id
                const rows = await sql`SELECT id FROM patients WHERE user_id = ${clientUsersId} LIMIT 1`;
                resolvedPatientId = rows.length > 0 ? rows[0].id : null;
            }

            if (!resolvedPatientId && userId) {
                // Indirect: look up via email
                const emailRows = await sql`SELECT a.email, p.role, p.gender FROM user_auth a LEFT JOIN user_profiles p ON p.user_id = a.user_id WHERE a.user_id = ${userId} LIMIT 1`;
                if (emailRows.length > 0) {
                    const { email, role, gender } = emailRows[0];
                    const { patientId } = await resolveUserIds(userId, email, role, gender);
                    resolvedPatientId = patientId;
                }
            }
        }

        if (!resolvedPatientId) {
            return res.status(400).json({ error: "Could not resolve patient_id — log out and log back in" });
        }

        // Create posture session
        const sessionRow = await sql`
            INSERT INTO posture_sessions (patient_id, status, overall_score, finished_at, model_version)
            VALUES (${resolvedPatientId}, 'completed', ${results.overall || 0}, NOW(), 'pose_landmarker_heavy')
            RETURNING id
        `;
        const sessionId = sessionRow[0].id;
        console.log("✅ Session created:", sessionId);

        // Save metrics
        for (const m of (results.metrics || [])) {
            await sql`
                INSERT INTO posture_metrics (session_id, metric_name, metric_score, metric_view, metric_status)
                VALUES (${sessionId}, ${m.name}, ${m.score}, ${m.view || null}, ${m.status || null})
            `;
        }

        // Save findings
        for (const f of (results.findings || [])) {
            await sql`
                INSERT INTO posture_findings (session_id, title, details, score, color, status)
                VALUES (${sessionId}, ${f.title}, ${JSON.stringify(f.details || [])}, ${f.score || 0}, ${f.color || null}, ${f.status || null})
            `;
        }

        // Save full report blob
        await sql`
            INSERT INTO reports (patient_id, session_id, report_data)
            VALUES (${resolvedPatientId}, ${sessionId}, ${JSON.stringify(results)})
        `;
        console.log("✅ Posture report fully saved, session:", sessionId);

        res.json({ success: true, sessionId });
    } catch (err) {
        console.error("❌ Posture report error:", err);
        res.status(500).json({ error: "Posture save failed: " + err.message });
    }
});

// ── 6. POST /api/exercise-report — Save exercise stats to health_metrics ─────
app.post("/api/exercise-report", async (req, res) => {
    const { userId, exercise, reps, formScore, duration } = req.body;
    console.log("🏋️ [EXERCISE SAVE] user_id:", userId, "exercise:", exercise, "reps:", reps);
    if (!userId || !exercise) return res.status(400).json({ error: "Missing userId or exercise" });
    try {
        // health_metrics.user_id -> user_profiles.user_id (which IS user_auth.user_id)
        await sql`
            INSERT INTO health_metrics (user_id, metric_type, metric_value) VALUES
                (${userId}, ${'exercise_reps_' + exercise}, ${reps || 0}),
                (${userId}, ${'exercise_score_' + exercise}, ${formScore || 0}),
                (${userId}, ${'exercise_duration_' + exercise}, ${duration || 0})
        `;
        res.json({ success: true });
    } catch (err) {
        console.error("❌ Exercise report error:", err);
        res.status(500).json({ error: "Exercise save failed: " + err.message });
    }
});

// ── 7. GET /api/chat-history ──────────────────────────────────────────────────
app.get("/api/chat-history", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    try {
        const msgs = await sql`SELECT role, text, created_at FROM chat_messages WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 100`;
        res.json({ success: true, messages: msgs });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 8. GET /api/posture-history ───────────────────────────────────────────────
app.get("/api/posture-history", async (req, res) => {
    const { patientId } = req.query;
    if (!patientId) return res.status(400).json({ error: "Missing patientId" });
    try {
        const sessions = await sql`
            SELECT s.id, s.overall_score, s.finished_at, r.report_data
            FROM posture_sessions s LEFT JOIN reports r ON r.session_id = s.id
            WHERE s.patient_id = ${patientId} ORDER BY s.finished_at DESC LIMIT 20
        `;
        res.json({ success: true, sessions });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── 9. GET /api/exercise-history ──────────────────────────────────────────────
app.get("/api/exercise-history", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    try {
        const metrics = await sql`
            SELECT metric_type, metric_value, recorded_at FROM health_metrics
            WHERE user_id = ${userId} ORDER BY recorded_at DESC LIMIT 50
        `;
        res.json({ success: true, metrics });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// ── 10. GET /api/doctor-patients ─────────────────────────────────────────────
app.get("/api/doctor-patients", async (req, res) => {
    const { doctorId } = req.query;
    if (!doctorId) return res.status(400).json({ error: "Missing doctorId" });
    try {
        const patients = await sql`
            SELECT 
                up.user_id as id, 
                up.name, 
                up.gender, 
                up.age, 
                up.weight,
                up.height,
                up.bmi,
                dp.assigned_at as lastVisit
            FROM doctor_patients dp
            JOIN user_profiles up ON up.user_id = dp.patient_id
            WHERE dp.doctor_id = ${doctorId}::uuid
            ORDER BY dp.assigned_at DESC
        `;
        res.json({ success: true, patients });
    } catch (err) {
        console.error("doctor-patients error:", err);
        res.status(500).json({ error: err.message });
    }
});


// ── 11. GET /api/lookup-patient — Find patient by user_id ────────────────────
app.get("/api/lookup-patient", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    try {
        // Look up by user_auth.user_id (the UUID shown in Patient Settings)
        const rows = await sql`
            SELECT
                p.id            AS patient_id,
                up.user_id,
                up.name,
                up.email,
                up.age,
                up.gender,
                up.bmi,
                up.weight,
                up.height
            FROM user_profiles up
            JOIN user_auth ua ON ua.user_id = ${userId}::uuid
            JOIN users u ON u.email = up.email
            JOIN patients p ON p.user_id = u.id
            WHERE up.user_id = ${userId}::uuid
            LIMIT 1
        `;
        if (!rows.length) return res.json({ success: false, error: "No patient found with this ID." });
        res.json({ success: true, patient: rows[0] });
    } catch (err) {
        console.error("lookup-patient error:", err);
        if (err.message?.includes('invalid input syntax for type uuid')) {
            return res.json({ success: false, error: "Invalid ID format. Please copy the exact ID from the patient's Settings page." });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── 12. POST /api/add-doctor-patient — Link doctor to patient ────────────────
app.post("/api/add-doctor-patient", async (req, res) => {
    const { doctorId, patientId } = req.body;
    if (!doctorId || !patientId) return res.status(400).json({ error: "Missing doctorId or patientId" });
    try {
        // Check if already linked
        const existing = await sql`
            SELECT id FROM doctor_patients
            WHERE doctor_id = ${doctorId}::uuid AND patient_id = ${patientId}::uuid
        `;
        if (existing.length > 0) {
            return res.json({ success: false, error: "This patient is already in your list." });
        }
        await sql`
            INSERT INTO doctor_patients (doctor_id, patient_id)
            VALUES (${doctorId}::uuid, ${patientId}::uuid)
        `;
        res.json({ success: true });
    } catch (err) {
        console.error("add-doctor-patient error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));