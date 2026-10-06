import { neon } from '@neondatabase/serverless';

let client;

/** Neon's HTTP driver: one query per request, which suits Vercel functions. */
export function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to .env locally, or to the Vercel project settings.');
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}
