import { Router } from 'express';
import { ScanController } from './scan.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { uploadMiddleware } from './scan.middleware';
import { scanRateLimiter } from '@/shared/middleware/rateLimit.middleware';

const router = Router();
const controller = new ScanController();

/**
 * @swagger
 * /api/v1/scan:
 *   post:
 *     tags:
 *       - Scan
 *     summary: Process business card image and extract information
 *     description: "Upload and OCR a scanned business card to extract contact details"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Business card image (JPEG or PNG, max 5MB)
 *               eventId:
 *                 type: string
 *                 description: MongoDB ObjectId of the event
 *                 example: "65a1b2c3d4e5f6a7b8c9d0e1"
 *             required:
 *               - image
 *               - eventId
 *     responses:
 *       200:
 *         description: Scan processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     extractedFields:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           nullable: true
 *                         company:
 *                           type: string
 *                           nullable: true
 *                         title:
 *                           type: string
 *                           nullable: true
 *                         phone:
 *                           type: string
 *                           nullable: true
 *                         email:
 *                           type: string
 *                           nullable: true
 *                         website:
 *                           type: string
 *                           nullable: true
 *                         address:
 *                           type: string
 *                           nullable: true
 *                     rawText:
 *                       type: string
 *                       description: All text visible on the card
 *                     imageUrl:
 *                       type: string
 *                       description: Google Drive shareable URL
 *                     driveFileId:
 *                       type: string
 *                       description: Google Drive file ID for reference
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     extractedFields:
 *                       name: "John Smith"
 *                       company: "Tech Corp"
 *                       title: "Software Engineer"
 *                       phone: "+1-555-0101"
 *                       email: "john.smith@techcorp.com"
 *                       website: "https://techcorp.com"
 *                       address: "123 Tech Lane, Silicon Valley"
 *                     rawText: "JOHN SMITH\nTech Corp\nSoftware Engineer\n..."
 *                     imageUrl: "https://drive.google.com/uc?id=..."
 *                     driveFileId: "1abc2def3ghi4jkl5mno6pqr"
 *       400:
 *         description: Invalid file or missing eventId
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Event not owned by user
 *       404:
 *         description: Event not found
 *       412:
 *         description: Google account not connected
 *       429:
 *         description: Rate limit exceeded
 *       502:
 *         description: Anthropic or Drive API error
 */
router.post(
  '/',
  authMiddleware,
  scanRateLimiter,
  uploadMiddleware.single('image'),
  controller.scanImage
);

export default router;
