# Hospital front desk register

A front-desk app for hospital reception staff: sign in, record walk-in patients
(date, name, gender, mobile, address, remarks), and look them up on a dashboard
filtered by name and date.

## Stack

- **Frontend:** plain HTML, CSS and JavaScript in `public/`
- **Backend:** Node.js (Express) — in progress
- **Database:** Neon (Postgres) — in progress
- **Hosting:** Vercel, deployed from this GitHub repo

## Current status

The frontend is a clickable design preview running on sample data
(`public/js/mock-api.js`). Sign in with `admin` / `admin123`. Entries you save
last only until the browser tab is closed.

## Preview locally

```sh
npx http-server public -p 5391
```

Then open http://localhost:5391.
