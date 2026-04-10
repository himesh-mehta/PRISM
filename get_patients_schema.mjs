import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// Get patients schema
const cols = await sql`
  SELECT column_name, data_type, column_default, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'patients' ORDER BY ordinal_position
`;
console.log("=== patients ===");
cols.forEach(c => console.log(`  ${c.column_name} | ${c.data_type} | default: ${c.column_default}`));
