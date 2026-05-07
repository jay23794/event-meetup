import { Router } from 'express';
import { BoothController } from './booth.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import { createBoothSchema } from './booth.schema';

const router = Router({ mergeParams: true });
const controller = new BoothController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths:
 *   post:
 *     tags:
 *       - Booths
 *     summary: Create booth and append to event sheet
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               boothName:
 *                 type: string
 *               scans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ocrText:
 *                       type: string
 *                     extractedFields:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         company:
 *                           type: string
 *                         title:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         website:
 *                           type: string
 *                         address:
 *                           type: string
 *                     imageUrl:
 *                       type: string
 *               voiceNote:
 *                 type: object
 *                 properties:
 *                   transcript:
 *                     type: string
 *                   durationSec:
 *                     type: number
 *     responses:
 *       201:
 *         description: Booth created and appended to sheet
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
 *                     boothId:
 *                       type: string
 *                     sheetRowNumber:
 *                       type: number
 *       400:
 *         description: Validation error
 *       404:
 *         description: Event not found
 *       412:
 *         description: Google account not connected
 */
router.post('/', validate(createBoothSchema), controller.createBooth);

export default router;
