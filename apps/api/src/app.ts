import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { discoverRouter } from './routes/discover.js';
import { errorHandler } from './middleware/errors.js';
export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: env.WEB_ORIGIN.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  }),
);
app.use(
  rateLimit({
    windowMs: 60000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Take a moment, then try again.' },
    },
  }),
);
app.use(express.json({ limit: '4kb' }));
app.get('/health', (_req, res) =>
  res
    .status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({ success: mongoose.connection.readyState === 1 }),
);
app.use(discoverRouter);
app.use((_req, res) => {
  res
    .status(404)
    .json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } });
});
app.use(errorHandler);
