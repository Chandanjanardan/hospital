import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';
import { startSession, endSession, requireAuth } from '../lib/auth.js';
import { validatePatient, isIsoDate } from '../lib/validate.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Compared against when the user ID doesn't exist, so both cases take the same time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const PATIENT_COLUMNS = (sql) => sql`
  id,
  to_char(visit_date, 'YYYY-MM-DD') AS "visitDate",
  patient_name AS "patientName",
  gender,
  mobile,
  address,
  remarks,
  created_by AS "createdBy"
`;

/* ---------- Session ---------- */

app.post('/api/login', async (req, res) => {
  const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!userId || !password) {
    return res.status(400).json({ error: 'Enter your user ID and password.' });
  }

  const sql = db();
  const [user] = await sql`
    SELECT user_id, full_name, password_hash FROM staff_users
    WHERE user_id = ${userId} AND active
  `;
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    return res.status(401).json({ error: 'That user ID and password don’t match. Check both and try again.' });
  }

  const session = { userId: user.user_id, name: user.full_name };
  startSession(res, session);
  res.json(session);
});

app.post('/api/logout', (req, res) => {
  endSession(res);
  res.status(204).end();
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.user);
});

/* ---------- Patients ---------- */

app.get('/api/patients/next-reg-no', requireAuth, async (req, res) => {
  const sql = db();
  const [row] = await sql`SELECT COALESCE(MAX(id), 0) + 1 AS next FROM patients`;
  res.json({ next: Number(row.next) });
});

app.post('/api/patients', requireAuth, async (req, res) => {
  const { data, errors } = validatePatient(req.body);
  if (errors) {
    return res.status(400).json({ error: 'Some details need fixing.', fields: errors });
  }

  const sql = db();
  const [patient] = await sql`
    INSERT INTO patients (visit_date, patient_name, gender, mobile, address, remarks, created_by)
    VALUES (${data.visitDate}, ${data.patientName}, ${data.gender}, ${data.mobile},
            ${data.address}, ${data.remarks}, ${req.user.userId})
    RETURNING ${PATIENT_COLUMNS(sql)}
  `;
  res.status(201).json(patient);
});

app.get('/api/patients', requireAuth, async (req, res) => {
  const rawName = typeof req.query.name === 'string' ? req.query.name.trim().slice(0, 120) : '';
  // Treat % and _ as plain characters, not wildcards
  const name = rawName ? '%' + rawName.replace(/[\\%_]/g, '\\$&') + '%' : null;
  let from = isIsoDate(req.query.from) ? req.query.from : null;
  let to = isIsoDate(req.query.to) ? req.query.to : null;
  if (from && to && from > to) [from, to] = [to, from];

  const sql = db();
  const rows = await sql`
    SELECT ${PATIENT_COLUMNS(sql)}
    FROM patients
    WHERE (${name}::text IS NULL OR patient_name ILIKE ${name})
      AND (${from}::date IS NULL OR visit_date >= ${from}::date)
      AND (${to}::date IS NULL OR visit_date <= ${to}::date)
    ORDER BY visit_date DESC, id DESC
    LIMIT 2000
  `;
  res.json(rows);
});

/* ---------- Errors ---------- */

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again in a moment.' });
});

export default app;
