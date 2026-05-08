import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspectAll() {
  const tables = ['chat_messages', 'posture_sessions', 'posture_metrics', 'posture_findings', 'reports', 'health_metrics'];
  for (const table of tables) {
    const cols = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = ${table}
      ORDER BY ordinal_position
    `;
    console.log(`\n=== ${table} ===`);
    cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) default=${c.column_default} nullable=${c.is_nullable}`));
  }
}

inspectAll().catch(console.error);
