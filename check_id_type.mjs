import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function check() {
  const schema = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'posture_sessions' AND column_name = 'patient_id'
  `;
  console.log(JSON.stringify(schema, null, 2));
}
check();
