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

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
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
});

export default app;
