/*
 * Creates the tables and the first staff login. Safe to run more than once:
 * existing tables and users are left as they are.
 *
 *   npm run db:setup
 */
import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';

const sql = db();

await sql`
  CREATE TABLE IF NOT EXISTS staff_users (
    id            serial PRIMARY KEY,
    user_id       text NOT NULL UNIQUE CHECK (user_id = lower(user_id) AND length(user_id) BETWEEN 3 AND 40),
    full_name     text NOT NULL,
    password_hash text NOT NULL,
    active        boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS patients (
    id           serial PRIMARY KEY,
    visit_date   date NOT NULL,
    patient_name text NOT NULL CHECK (length(patient_name) BETWEEN 2 AND 120),
    gender       text NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    mobile       varchar(10) NOT NULL CHECK (mobile ~ '^[6-9][0-9]{9}$'),
    address      text NOT NULL CHECK (length(address) <= 300),
    remarks      text NOT NULL DEFAULT '' CHECK (length(remarks) <= 500),
    created_by   text NOT NULL REFERENCES staff_users (user_id),
    created_at   timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`CREATE INDEX IF NOT EXISTS patients_visit_date_idx ON patients (visit_date DESC, id DESC)`;

const userId = (process.env.ADMIN_USER || 'admin').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'Front Desk';

if (!password) {
  console.error('Tables are ready, but ADMIN_PASSWORD is empty in .env, so no login was created.');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const created = await sql`
  INSERT INTO staff_users (user_id, full_name, password_hash)
  VALUES (${userId}, ${name}, ${hash})
  ON CONFLICT (user_id) DO NOTHING
  RETURNING user_id
`;

console.log('Tables are ready.');
console.log(created.length
  ? `Created login "${userId}".`
  : `Login "${userId}" already exists; its password was not changed. Use "npm run user:set" to change it.`);
