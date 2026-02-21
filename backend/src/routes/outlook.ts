import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { fetchOutlookEmails } from '../services/outlook';

const router = Router();
const prisma = new PrismaClient();

// GET /api/outlook/status
router.get('/status', requireAuth, async (req: AuthRequest, res: Response) => {
  const connector = await prisma.outlookConnector.findUnique({
    where: { userId: req.user!.id },
  });
  return res.json(connector);
});

// POST /api/outlook/connect-mock
router.post('/connect-mock', requireAuth, async (req: AuthRequest, res: Response) => {
  const { displayEmail } = req.body;

  const connector = await prisma.outlookConnector.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      connected: true,
      mockMode: true,
      displayEmail: displayEmail || req.user!.email,
    },
    update: {
      connected: true,
      mockMode: true,
      displayEmail: displayEmail || req.user!.email,
    },
  });

  return res.json(connector);
});

// DELETE /api/outlook/disconnect
router.delete('/disconnect', requireAuth, async (req: AuthRequest, res: Response) => {
  const connector = await prisma.outlookConnector.upsert({
    where: { userId: req.user!.id },
    create: {
      userId: req.user!.id,
      connected: false,
      mockMode: true,
    },
    update: {
      connected: false,
    },
  });

  return res.json(connector);
});

// GET /api/outlook/preview-emails
router.get('/preview-emails', requireAuth, async (req: AuthRequest, res: Response) => {
  const connector = await prisma.outlookConnector.findUnique({
    where: { userId: req.user!.id },
  });

  if (!connector?.connected) {
    return res.status(400).json({
      error: 'NOT_CONNECTED',
      message: 'Outlook is not connected',
      statusCode: 400,
    });
  }

  const emails = await fetchOutlookEmails(connector);
  return res.json(emails);
});

export { router as outlookRouter };
