import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkDefaults() {
  try {
    const defaults = await sql`
      SELECT table_name, column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name IN ('user_auth', 'user_profiles')
      AND column_name = 'user_id'
    `;
    console.log(JSON.stringify(defaults, null, 2));
  } catch (err) {
    console.error("Error checking defaults:", err.message);
  }
}

checkDefaults();
