import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import syllabusRoutes from './routes/syllabus';
import authRoutes from './routes/auth';
import progressRoutes from './routes/progress';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { loadSyllabus } from './services/syllabusLoader';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(helmet());

app.use(
  cors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return cb(null, true);
      }
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), version: '1.0.0' },
  });
});

app.use('/api', syllabusRoutes);
app.use('/api', authRoutes);
app.use('/api', progressRoutes);

app.use('/api/*', notFoundHandler);
app.use(errorHandler);

try {
  const syllabus = loadSyllabus();
  const classCount = Object.keys(syllabus.classes).length;
  console.log(`[Startup] Syllabus loaded: ${classCount} classes`);
} catch (err) {
  console.error('[Startup] Failed to load syllabus data:', err);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`[Crestline API] Listening on port ${PORT}`);
  console.log(`[Crestline API] Allowed origins: ${allowedOrigins.join(', ')}`);
});

export default app;
