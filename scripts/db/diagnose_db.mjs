import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);

const cm = await sql`SELECT COUNT(*) as n FROM chat_messages`;
const ps = await sql`SELECT COUNT(*) as n FROM posture_sessions`;
const hm = await sql`SELECT COUNT(*) as n FROM health_metrics`;
const ua = await sql`SELECT user_id, email FROM user_auth LIMIT 5`;

console.log('chat_messages:', cm[0].n);
console.log('posture_sessions:', ps[0].n);
console.log('health_metrics:', hm[0].n);
console.log('user_auth rows:', ua);
