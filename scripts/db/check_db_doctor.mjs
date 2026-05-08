import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

async function check() {
  try {
    const doctors = await sql`SELECT * FROM doctors LIMIT 5`;
    console.log('Doctors Table:', JSON.stringify(doctors, null, 2));
    
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Public Tables:', tables.map(t => t.table_name).join(', '));
  } catch (e) {
    console.error('Check failed:', e);
  }
}
check();
