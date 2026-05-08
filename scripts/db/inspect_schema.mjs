import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspectSchema() {
  try {
    const columns = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('health_metrics', 'posture_metrics')
      ORDER BY table_name, ordinal_position
    `;
    console.log(JSON.stringify(columns, null, 2));
  } catch (err) {
    console.error("Error inspecting schema:", err.message);
  }
}

inspectSchema();
