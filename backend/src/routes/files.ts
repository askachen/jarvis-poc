import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { parseFile } from '../services/fileParser';

const router = Router();

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

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// POST /api/files/upload
router.post('/upload', requireAuth, (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, async (err) => {
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
        message: 'No file uploaded',
        statusCode: 400,
      });
    }

    const { file } = req;
    let extractedText = '';
    let parseError = '';

    try {
      extractedText = await parseFile(file.path, file.mimetype);
    } catch (error) {
      parseError = (error as Error).message;
      console.error('Parse error:', parseError);
    }

    return res.json({
      name: file.originalname,
      path: `/uploads/${file.filename}`,
      size: file.size,
      type: file.mimetype,
      extractedText,
      parseError: parseError || undefined,
    });
  });
});

export { router as filesRouter };
