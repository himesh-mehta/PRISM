import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
const r = await sql`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='patients' AND is_nullable='NO' ORDER BY ordinal_position`;
console.log("NOT NULL columns in patients:");
r.forEach(c => console.log(`  ${c.column_name} | default: ${c.column_default}`));
