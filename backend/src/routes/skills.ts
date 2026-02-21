import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { parseSkillZip } from '../services/skills';

const router = Router();
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const isZipMime = file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.mimetype === 'application/x-zip';
    const isZipExt = path.extname(file.originalname).toLowerCase() === '.zip';
    if (isZipMime || isZipExt) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'));
    }
  },
});

// GET /api/skills
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const skills = await prisma.skill.findMany({
    where: {
      OR: [{ ownerId: userId }, { isSystem: true }],
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(skills);
});

// POST /api/skills
router.post('/', requireAuth, (req: AuthRequest, res: Response) => {
  upload.single('zip')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        error: 'UPLOAD_ERROR',
        message: err.message,
        statusCode: 400,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'No zip file uploaded',
        statusCode: 400,
      });
    }

    const userId = req.user!.id;
    const filePath = req.file.path;

    let parsed;
    try {
      const buffer = fs.readFileSync(filePath);
      parsed = await parseSkillZip(buffer);
    } catch (parseErr) {
      fs.unlink(filePath, () => {});
      return res.status(400).json({
        error: 'PARSE_ERROR',
        message: (parseErr as Error).message,
        statusCode: 400,
      });
    }

    const skill = await prisma.skill.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        type: 'user_upload',
        zipPath: `/uploads/${req.file.filename}`,
        skillContent: parsed.content,
        isSystem: false,
        enabled: true,
        ownerId: userId,
      },
    });

    return res.status(201).json(skill);
  });
});

// DELETE /api/skills/:id
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const skill = await prisma.skill.findUnique({ where: { id } });

  if (!skill) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Skill not found',
      statusCode: 404,
    });
  }

  if (skill.ownerId !== userId) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'You do not own this skill',
      statusCode: 403,
    });
  }

  // Delete the zip file
  if (skill.zipPath) {
    const rel = skill.zipPath.startsWith('/') ? skill.zipPath.slice(1) : skill.zipPath;
    const fullPath = path.join(__dirname, '../../', rel);
    fs.unlink(fullPath, () => {});
  }

  await prisma.skill.delete({ where: { id } });

  return res.status(204).send();
});

export { router as skillsRouter };
