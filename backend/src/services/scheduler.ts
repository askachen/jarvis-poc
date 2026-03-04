import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { runTaskPrompt } from './ai';
import { hasEmailKeywords, fetchOutlookEmails, formatEmailsForPrompt } from './outlook';

const prisma = new PrismaClient();
const schedulerMap = new Map<string, cron.ScheduledTask>();

export interface SchedulableTask {
  id: string;
  userId: string;
  name: string;
  prompt: string;
  cronExpr: string;
  enabled: boolean;
}

export async function executeTask(task: SchedulableTask): Promise<void> {
  console.log(`[Scheduler] Running task "${task.name}" (${task.id})`);

  let taskRunId: string | undefined;

  try {
    const taskRun = await prisma.taskRun.create({
      data: {
        taskId: task.id,
        status: 'running',
      },
    });
    taskRunId = taskRun.id;

    await prisma.task.update({
      where: { id: task.id },
      data: { lastRunAt: new Date() },
    });

    let effectivePrompt = task.prompt;
    if (hasEmailKeywords(task.prompt)) {
      const connector = await prisma.outlookConnector.findUnique({ where: { userId: task.userId } });
      if (connector?.connected) {
        const emails = await fetchOutlookEmails(connector);
        effectivePrompt = `${formatEmailsForPrompt(emails)}\n${task.prompt}`;
        console.log(`[Scheduler] Injecting ${emails.length} Outlook emails into task "${task.name}"`);
      }
    }
    const result = await runTaskPrompt(effectivePrompt);

    await prisma.taskRun.update({
      where: { id: taskRun.id },
      data: {
        status: 'success',
        result,
        finishedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: task.userId,
        title: `Task "${task.name}" completed`,
        body: result.slice(0, 500),
        taskRunId: taskRun.id,
      },
    });

    console.log(`[Scheduler] Task "${task.name}" succeeded`);
  } catch (e: any) {
    const errorMessage = e?.message || 'Unknown error';
    console.error(`[Scheduler] Task "${task.name}" failed:`, errorMessage);

    if (taskRunId) {
      try {
        await prisma.taskRun.update({
          where: { id: taskRunId },
          data: {
            status: 'failed',
            error: errorMessage,
            finishedAt: new Date(),
          },
        });

        await prisma.notification.create({
          data: {
            userId: task.userId,
            title: `Task "${task.name}" failed`,
            body: errorMessage.slice(0, 500),
            taskRunId,
          },
        });
      } catch (dbErr: any) {
        console.error(`[Scheduler] Failed to update task run status:`, dbErr?.message);
      }
    }
  }
}

export function scheduleTask(task: SchedulableTask): void {
  // Stop existing job if any
  unscheduleTask(task.id);

  if (!task.enabled) return;

  if (!cron.validate(task.cronExpr)) {
    console.error(`[Scheduler] Invalid cron expression for task "${task.name}": ${task.cronExpr}`);
    return;
  }

  const job = cron.schedule(task.cronExpr, () => {
    executeTask(task).catch((err) => {
      console.error(`[Scheduler] Unhandled error in task "${task.name}":`, err?.message || err);
    });
  }, {
    timezone: 'Asia/Taipei',
  });

  schedulerMap.set(task.id, job);
  console.log(`[Scheduler] Scheduled task "${task.name}" with cron "${task.cronExpr}"`);
}

export function unscheduleTask(taskId: string): void {
  const existing = schedulerMap.get(taskId);
  if (existing) {
    existing.stop();
    schedulerMap.delete(taskId);
  }
}

export async function startScheduler(): Promise<void> {
  console.log('[Scheduler] Starting scheduler...');

  const tasks = await prisma.task.findMany({
    where: { enabled: true },
  });

  for (const task of tasks) {
    scheduleTask({
      id: task.id,
      userId: task.userId,
      name: task.name,
      prompt: task.prompt,
      cronExpr: task.cronExpr,
      enabled: task.enabled,
    });
  }

  console.log(`[Scheduler] Loaded ${tasks.length} task(s)`);
}
