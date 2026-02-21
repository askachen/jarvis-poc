import express from 'express';
import cors from 'cors';
import path from 'path';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { conversationsRouter } from './routes/conversations';
import { messagesRouter } from './routes/messages';
import { filesRouter } from './routes/files';
import { tasksRouter } from './routes/tasks';
import { notificationsRouter } from './routes/notifications';
import { outlookRouter } from './routes/outlook';
import { skillsRouter } from './routes/skills';
import { adminRouter } from './routes/admin';
import { startScheduler } from './services/scheduler';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || false
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/conversations', messagesRouter);
app.use('/api/files', filesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/outlook', outlookRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React frontend in production (must come after all API routes)
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '../public');
  app.use(express.static(publicDir));
  app.get('*', (_, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    statusCode,
  });
});

app.listen(PORT, () => {
  console.log(`Jarvis backend running on port ${PORT}`);
  startScheduler().catch((err) => {
    console.error('[Scheduler] Failed to start:', err);
  });
});
