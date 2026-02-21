import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'No token provided',
      statusCode: 401,
    });
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'JWT secret not configured',
      statusCode: 500,
    });
  }

  try {
    const payload = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }
}
