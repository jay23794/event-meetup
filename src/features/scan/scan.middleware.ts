import multer from 'multer';
import { SCAN_CONFIG } from '@/config/scan';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (SCAN_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG/PNG images are accepted'));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: SCAN_CONFIG.MAX_IMAGE_SIZE_BYTES, files: 1 },
  fileFilter,
});
