import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: req.user!.id } }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);

  return res.json({
    data: notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });

  return res.json({ success: true });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id },
  });

  if (!notification) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Notification not found',
      statusCode: 404,
    });
  }

  if (notification.userId !== req.user!.id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
    });
  }

  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });

  return res.json(updated);
});

export { router as notificationsRouter };
