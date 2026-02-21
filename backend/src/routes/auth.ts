import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Email and password are required',
      statusCode: 400,
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid credentials',
      statusCode: 401,
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid credentials',
      statusCode: 401,
    });
  }

  const secret = process.env.JWT_SECRET!;
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    secret,
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  // Client-side clears the token
  return res.status(204).send();
});

export { router as authRouter };
