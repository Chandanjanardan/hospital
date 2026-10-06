/*
 * Local development only. On Vercel, public/ is served as static files
 * and api/index.js runs as a serverless function.
 *
 *   npm run dev
 */
import express from 'express';
import app from './api/index.js';

const port = Number(process.env.PORT) || 3000;

const server = express();
server.use(app);
server.use(express.static('public', { extensions: ['html'] }));

server.listen(port, '0.0.0.0', () => {
  console.log(`Front desk running at http://localhost:${port}`);
});
