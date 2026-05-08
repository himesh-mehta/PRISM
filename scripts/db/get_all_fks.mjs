import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// Get ALL FKs in the entire schema
const fkeys = await sql`
  SELECT
    tc.table_name, kcu.column_name,
    ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
  FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
  ORDER BY tc.table_name
`;
console.log("=== ALL FK constraints ===");
fkeys.forEach(f => console.log(`  ${f.table_name}.${f.column_name} -> ${f.foreign_table}.${f.foreign_column}`));

// Also check user_auth columns
const uaCols = await sql`
  SELECT column_name, data_type, column_default, is_nullable 
  FROM information_schema.columns WHERE table_name = 'user_auth' ORDER BY ordinal_position
`;
console.log("\n=== user_auth columns ===");
uaCols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | default: ${c.column_default} | nullable: ${c.is_nullable}`));
