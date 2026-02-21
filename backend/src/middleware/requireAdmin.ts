import { Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from './auth';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Admin access required',
        statusCode: 403,
      });
    }
    next();
  });
}
