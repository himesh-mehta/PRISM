import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function syncDoctors() {
  try {
    console.log('🔄 Syncing doctors...');
    // Find users with role='doctor' who are NOT in doctors table
    const missingDoctors = await sql`
      SELECT id, email FROM users
      WHERE role = 'doctor'
      AND id NOT IN (SELECT user_id FROM doctors)
    `;
    
    console.log(`Found ${missingDoctors.length} missing doctors.`);
    
    for (const d of missingDoctors) {
      await sql`
        INSERT INTO doctors (user_id)
        VALUES (${d.id})
      `;
      console.log(`✅ Added doctor: ${d.email}`);
    }
    
    console.log('🚀 Sync complete.');
  } catch (e) {
    console.error('Sync failed:', e);
  }
}
syncDoctors();
