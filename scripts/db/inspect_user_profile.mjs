import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function inspectUserProfile() {
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `;
    console.log(JSON.stringify(columns, null, 2));
  } catch (err) {
    console.error("Error inspecting user_profile:", err.message);
  }
}

inspectUserProfile();
