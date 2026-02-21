import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/conversations
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.conversation.count({ where: { userId: req.user!.id } }),
  ]);

  return res.json({
    data: conversations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/conversations
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const conversation = await prisma.conversation.create({
    data: {
      userId: req.user!.id,
      title: req.body.title || 'New Conversation',
    },
  });

  return res.status(201).json(conversation);
});

// DELETE /api/conversations/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
  });

  if (!conversation) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Conversation not found',
      statusCode: 404,
    });
  }

  if (conversation.userId !== req.user!.id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
    });
  }

  // Cascade delete is handled by Prisma schema
  await prisma.conversation.delete({ where: { id: req.params.id } });

  return res.status(204).send();
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
  });

  if (!conversation) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Conversation not found',
      statusCode: 404,
    });
  }

  if (conversation.userId !== req.user!.id) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
    });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });

  return res.json(messages);
});

export { router as conversationsRouter };
