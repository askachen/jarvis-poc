import { Router, Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/requireAdmin';
import { AuthRequest } from '../middleware/auth';
import { parseSkillZip } from '../services/skills';
import { testMcpConnection } from '../services/mcp';

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
  limits: { fileSize: 10 * 1024 * 1024 },
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

// GET /api/admin/stats
router.get('/stats', requireAdmin as any, async (_req: Request, res: Response) => {
  const [userCount, skillCount, mcpCount] = await Promise.all([
    prisma.user.count(),
    prisma.skill.count(),
    prisma.mcpServer.count(),
  ]);
  return res.json({ userCount, skillCount, mcpCount });
});

// GET /api/admin/users
router.get('/users', requireAdmin as any, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  return res.json(users);
});

// GET /api/admin/skills
router.get('/skills', requireAdmin as any, async (_req: Request, res: Response) => {
  const skills = await prisma.skill.findMany({
    include: { owner: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(skills);
});

// POST /api/admin/skills
router.post('/skills', requireAdmin as any, (req: Request, res: Response) => {
  upload.single('zip')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        error: 'UPLOAD_ERROR',
        message: err.message,
        statusCode: 400,
      });
    }

    if (req.file) {
      // Zip upload flow
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
          type: 'system',
          zipPath: `/uploads/${req.file.filename}`,
          skillContent: parsed.content,
          isSystem: true,
          enabled: true,
          ownerId: null,
        },
      });
      return res.status(201).json(skill);
    } else {
      // JSON body flow
      const { name, description, skillContent } = req.body;
      if (!name) {
        return res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'name is required',
          statusCode: 400,
        });
      }
      const skill = await prisma.skill.create({
        data: {
          name,
          description,
          type: 'system',
          skillContent,
          isSystem: true,
          enabled: true,
          ownerId: null,
        },
      });
      return res.status(201).json(skill);
    }
  });
});

// PUT /api/admin/skills/:id
router.put('/skills/:id', requireAdmin as any, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, enabled } = req.body;

  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Skill not found', statusCode: 404 });
  }

  const updated = await prisma.skill.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(enabled !== undefined && { enabled }),
    },
  });
  return res.json(updated);
});

// DELETE /api/admin/skills/:id
router.delete('/skills/:id', requireAdmin as any, async (req: Request, res: Response) => {
  const { id } = req.params;

  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Skill not found', statusCode: 404 });
  }

  if (skill.zipPath) {
    const rel = skill.zipPath.startsWith('/') ? skill.zipPath.slice(1) : skill.zipPath;
    const fullPath = path.join(__dirname, '../../', rel);
    fs.unlink(fullPath, () => {});
  }

  await prisma.skill.delete({ where: { id } });
  return res.status(204).send();
});

// GET /api/admin/mcp-servers
router.get('/mcp-servers', requireAdmin as any, async (_req: Request, res: Response) => {
  const servers = await prisma.mcpServer.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return res.json(servers);
});

// POST /api/admin/mcp-servers
router.post('/mcp-servers', requireAdmin as any, async (req: Request, res: Response) => {
  const { name, description, command, args, env } = req.body;

  if (!name || !command) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'name and command are required',
      statusCode: 400,
    });
  }

  const server = await prisma.mcpServer.create({
    data: {
      name,
      description,
      command,
      args: args ?? [],
      env: env ?? {},
      isSystem: true,
      ownerId: null,
    },
  });
  return res.status(201).json(server);
});

// PUT /api/admin/mcp-servers/:id
router.put('/mcp-servers/:id', requireAdmin as any, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, command, args, env } = req.body;

  const server = await prisma.mcpServer.findUnique({ where: { id } });
  if (!server) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'MCP server not found', statusCode: 404 });
  }

  const updated = await prisma.mcpServer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(command !== undefined && { command }),
      ...(args !== undefined && { args }),
      ...(env !== undefined && { env }),
    },
  });
  return res.json(updated);
});

// DELETE /api/admin/mcp-servers/:id
router.delete('/mcp-servers/:id', requireAdmin as any, async (req: Request, res: Response) => {
  const { id } = req.params;

  const server = await prisma.mcpServer.findUnique({ where: { id } });
  if (!server) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'MCP server not found', statusCode: 404 });
  }

  await prisma.mcpServer.delete({ where: { id } });
  return res.status(204).send();
});

// POST /api/admin/mcp-servers/:id/test
router.post('/mcp-servers/:id/test', requireAdmin as any, async (req: Request, res: Response) => {
  const { id } = req.params;

  const server = await prisma.mcpServer.findUnique({ where: { id } });
  if (!server) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'MCP server not found', statusCode: 404 });
  }

  const result = await testMcpConnection({
    command: server.command,
    args: server.args as string[],
    env: server.env as Record<string, string>,
  });

  return res.json(result);
});

export { router as adminRouter };
