/*
 * Adds a staff login, or changes the password (and name) of an existing one.
 *
 *   npm run user:set -- <user-id> <password> "<Full name>"
 *   npm run user:set -- reception2 S3cure!pass "Asha Verma"
 */
import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';

const [rawId, password, ...nameParts] = process.argv.slice(2);
const userId = (rawId || '').trim().toLowerCase();
const name = nameParts.join(' ').trim() || userId;

if (!/^[a-z0-9._-]{3,40}$/.test(userId) || !password) {
  console.error('Usage: npm run user:set -- <user-id> <password> "<Full name>"');
  console.error('User ID: 3–40 characters, letters, numbers, dot, dash or underscore.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Use a password of at least 8 characters.');
  process.exit(1);
}

const sql = db();
const hash = await bcrypt.hash(password, 10);
const [row] = await sql`
  INSERT INTO staff_users (user_id, full_name, password_hash)
  VALUES (${userId}, ${name}, ${hash})
  ON CONFLICT (user_id) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        full_name = CASE WHEN ${nameParts.length > 0} THEN EXCLUDED.full_name ELSE staff_users.full_name END,
        active = true
  RETURNING (xmax = 0) AS inserted
`;

console.log(row.inserted ? `Created login "${userId}".` : `Updated login "${userId}".`);
