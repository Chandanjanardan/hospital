# Hospital front desk register

A front-desk app for hospital reception staff: sign in, record walk-in patients
(date, name, gender, mobile, address, remarks), and look them up on a dashboard
filtered by name and date.

## Stack

- **Frontend:** plain HTML, CSS and JavaScript in `public/`
- **Backend:** Node.js + Express in `api/index.js`, runs as one Vercel function
- **Database:** Neon (Postgres)
- **Hosting:** Vercel, deployed automatically on every push to `main`

```
public/        pages, styles, browser scripts (js/api.js calls the backend)
api/index.js   all /api routes: login, logout, me, patients
lib/           database connection, sessions, validation
scripts/       database setup and staff login management
dev-server.js  local server (not used on Vercel)
```

## Run locally

Needs Node.js 22 or newer.

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `JWT_SECRET`
   and `ADMIN_PASSWORD`.
3. `npm run db:setup` creates the tables and the first login. It is safe to run again.
4. `npm run dev`, then open http://localhost:3000.

## Staff logins

Add a login, or change an existing one's password:

```sh
npm run user:set -- <user-id> <password> "<Full name>"
npm run user:set -- admin "a-new-strong-password"
```

## Deploy on Vercel

1. Import this GitHub repo in Vercel. Leave the framework as **Other** and the
   build settings empty; `vercel.json` handles the rest.
2. Under **Settings → Environment Variables** add `DATABASE_URL` and
   `JWT_SECRET` (the same values as `.env`).
3. Deploy. Every push to `main` redeploys.

## API

All routes except login need the session cookie set by `/api/login`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/login` | `{ userId, password }` → sets session cookie |
| POST | `/api/logout` | Clears the session |
| GET | `/api/me` | The signed-in user |
| GET | `/api/patients?name=&from=&to=` | List, newest first; dates as `YYYY-MM-DD` |
| POST | `/api/patients` | Save a patient |
| GET | `/api/patients/next-reg-no` | Number the next entry will probably get |
