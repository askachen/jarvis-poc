import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  });
});

export { router as usersRouter };
