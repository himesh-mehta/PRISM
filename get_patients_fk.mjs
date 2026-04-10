import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// Get all FKs involving patients table
const fkeys = await sql`
  SELECT
    tc.table_name, kcu.column_name,
    ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
  FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'patients'
`;
console.log("=== patients FK constraints ===");
fkeys.forEach(f => console.log(`  patients.${f.column_name} -> ${f.foreign_table}.${f.foreign_column}`));

// Also check the 'users' table structure since it might be the actual user table
const usersCols = await sql`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position
`;
console.log("\n=== users table ===");
usersCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | default: ${c.column_default}`));

const usersRows = await sql`SELECT * FROM users LIMIT 5`;
console.log("\n=== users rows ===", usersRows.length > 0 ? usersRows : "EMPTY");
