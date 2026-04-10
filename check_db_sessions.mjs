import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

// Check if any doctor exists and has a doctors table entry
const results = await sql`
  SELECT u.email, u.role, d.id as doctor_id, d.user_id as doctor_user_id
  FROM users u
  LEFT JOIN doctors d ON d.user_id = u.id
  WHERE u.role = 'doctor'
  LIMIT 5
`;
console.log('Doctors:', JSON.stringify(results, null, 2));

// Also check doctor_patients schema
const dpRows = await sql`SELECT * FROM doctor_patients LIMIT 5`;
console.log('doctor_patients rows:', JSON.stringify(dpRows, null, 2));
