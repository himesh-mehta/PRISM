import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

const cols = await sql`
  SELECT column_name, data_type, column_default, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'patients' ORDER BY ordinal_position
`;
console.log("=== patients schema ===");
cols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | default: ${c.column_default} | nullable: ${c.is_nullable}`));

// Check doctors/users table too (referenced by posture_sessions.doctor_id -> users.id)
const usersCols = await sql`
  SELECT column_name, data_type, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'users' ORDER BY ordinal_position
`;
console.log("\n=== users schema ===");
usersCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | default: ${c.column_default}`));
