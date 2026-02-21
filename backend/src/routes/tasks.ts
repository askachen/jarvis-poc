import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { scheduleTask, unscheduleTask, executeTask } from '../services/scheduler';

const router = Router();
const prisma = new PrismaClient();

const FREQUENCY_CRON_MAP: Record<string, string> = {
  hourly: '0 * * * *',
  daily_9am: '0 9 * * *',
  weekly_mon_9am: '0 9 * * 1',
};

function resolveCronExpr(frequency: string, customCronExpr?: string): string | null {
  if (frequency === 'custom') {
    if (!customCronExpr || !cron.validate(customCronExpr)) return null;
    return customCronExpr;
  }
  return FREQUENCY_CRON_MAP[frequency] || null;
}

// GET /api/tasks
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.task.count({ where: { userId: req.user!.id } }),
  ]);

  return res.json({
    data: tasks,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/tasks
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, prompt, frequency, cronExpr: customCronExpr, enabled = true } = req.body;

  if (!name || !prompt || !frequency) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'name, prompt, and frequency are required',
      statusCode: 400,
    });
  }

  const resolvedCron = resolveCronExpr(frequency, customCronExpr);
  if (!resolvedCron) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: frequency === 'custom'
        ? 'Invalid or missing cronExpr for custom frequency'
        : `Unknown frequency: ${frequency}`,
      statusCode: 400,
    });
  }

  const task = await prisma.task.create({
    data: {
      userId: req.user!.id,
      name,
      prompt,
      frequency,
      cronExpr: resolvedCron,
      enabled,
    },
  });

  if (task.enabled) {
    scheduleTask({
      id: task.id,
      userId: task.userId,
      name: task.name,
      prompt: task.prompt,
      cronExpr: task.cronExpr,
      enabled: task.enabled,
    });
  }

  return res.status(201).json(task);
});

// GET /api/tasks/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });

  if (!task) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found', statusCode: 404 });
  }
  if (task.userId !== req.user!.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied', statusCode: 403 });
  }

  return res.json(task);
});

// PUT /api/tasks/:id
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const existing = await prisma.task.findUnique({ where: { id: req.params.id } });

  if (!existing) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found', statusCode: 404 });
  }
  if (existing.userId !== req.user!.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied', statusCode: 403 });
  }

  const { name, prompt, frequency, cronExpr: customCronExpr, enabled } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (prompt !== undefined) updateData.prompt = prompt;
  if (enabled !== undefined) updateData.enabled = enabled;

  if (frequency !== undefined) {
    const resolvedCron = resolveCronExpr(frequency, customCronExpr);
    if (!resolvedCron) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: frequency === 'custom'
          ? 'Invalid or missing cronExpr for custom frequency'
          : `Unknown frequency: ${frequency}`,
        statusCode: 400,
      });
    }
    updateData.frequency = frequency;
    updateData.cronExpr = resolvedCron;
  }

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: updateData,
  });

  if (task.enabled) {
    scheduleTask({
      id: task.id,
      userId: task.userId,
      name: task.name,
      prompt: task.prompt,
      cronExpr: task.cronExpr,
      enabled: task.enabled,
    });
  } else {
    unscheduleTask(task.id);
  }

  return res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });

  if (!task) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found', statusCode: 404 });
  }
  if (task.userId !== req.user!.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied', statusCode: 403 });
  }

  unscheduleTask(task.id);
  await prisma.task.delete({ where: { id: req.params.id } });

  return res.status(204).send();
});

// GET /api/tasks/:id/runs
router.get('/:id/runs', requireAuth, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });

  if (!task) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found', statusCode: 404 });
  }
  if (task.userId !== req.user!.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied', statusCode: 403 });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [runs, total] = await Promise.all([
    prisma.taskRun.findMany({
      where: { taskId: req.params.id },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.taskRun.count({ where: { taskId: req.params.id } }),
  ]);

  return res.json({
    data: runs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/tasks/:id/trigger
router.post('/:id/trigger', requireAuth, async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });

  if (!task) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Task not found', statusCode: 404 });
  }
  if (task.userId !== req.user!.id) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied', statusCode: 403 });
  }

  // Fire and forget — response returns immediately
  executeTask({
    id: task.id,
    userId: task.userId,
    name: task.name,
    prompt: task.prompt,
    cronExpr: task.cronExpr,
    enabled: task.enabled,
  }).catch((err) => console.error('[Trigger] Task execution error:', err));

  return res.status(202).json({ message: 'Task triggered' });
});

export { router as tasksRouter };
