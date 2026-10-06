import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'hfd_session';
const SESSION_HOURS = 12;

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET is missing or too short. Set a long random value in .env or in Vercel.');
  }
  return value;
}

export function startSession(res, user) {
  const token = jwt.sign({ sub: user.userId, name: user.name }, secret(), {
    expiresIn: `${SESSION_HOURS}h`,
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
    maxAge: SESSION_HOURS * 60 * 60 * 1000,
    path: '/',
  });
}

export function endSession(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

/** Rejects the request with 401 unless it carries a valid session cookie. */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    const payload = jwt.verify(token, secret());
    req.user = { userId: payload.sub, name: payload.name };
    next();
  } catch {
    endSession(res);
    res.status(401).json({ error: 'Your session has ended. Sign in again.' });
  }
}
