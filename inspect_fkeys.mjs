import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// 1. Check patients table schema
const patientsCols = await sql`
  SELECT column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'patients' ORDER BY ordinal_position
`;
console.log("=== patients table ===");
patientsCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) default=${c.column_default}`));

// 2. Check what FK posture_sessions references
const fkeys = await sql`
  SELECT
    tc.constraint_name, tc.table_name, kcu.column_name,
    ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('posture_sessions', 'posture_metrics', 'posture_findings', 'reports', 'health_metrics', 'chat_messages')
  ORDER BY tc.table_name
`;
console.log("\n=== Foreign Key Constraints ===");
fkeys.forEach(f => console.log(`  ${f.table_name}.${f.column_name} -> ${f.foreign_table_name}.${f.foreign_column_name}`));

// 3. List existing patients
const patients = await sql`SELECT * FROM patients LIMIT 5`;
console.log("\n=== Existing patients rows ===", patients.length > 0 ? patients : "EMPTY");

// 4. Check user_profiles to understand link
const profiles = await sql`SELECT user_id, name, email, role FROM user_profiles LIMIT 5`;
console.log("\n=== user_profiles rows ===");
profiles.forEach(p => console.log(`  ${p.user_id} | ${p.name} | ${p.email} | ${p.role}`));
