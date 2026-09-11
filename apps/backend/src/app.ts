import express from 'express';
import cors from 'cors';
import assessmentRoutes from './routes/assessment.routes.js';
import reportRoutes from './routes/report.routes.js';
import authRoutes from './routes/auth.routes.js';
import reviewRoutes from './routes/review.routes.js';
import { env } from './config/env.js';

const app = express();
const allowedOrigins = env.frontendUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);
app.use(express.json({ limit: '20mb' }));
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'fieldready-api', database: 'postgresql' }),
);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
export default app;
