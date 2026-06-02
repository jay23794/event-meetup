import { Router } from 'express';
import { BoothController } from './booth.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import { createBoothSchema } from './booth.schema';
import boothDocumentRoutes from '@/features/boothDocument/boothDocument.routes';

const router = Router({ mergeParams: true });
const controller = new BoothController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths:
 *   get:
 *     tags:
 *       - Booths
 *     summary: List booths for an event
 *     description: "List all booth visits logged for an event (newest first, cursor-paginated by booth id)"
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *           maximum: 200
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           description: ObjectId of the last booth in the previous page
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booths listed (results cached for 60 seconds)
 *       404:
 *         description: Event not found
 */
router.get('/', controller.listBooths);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths/{boothId}:
 *   get:
 *     tags:
 *       - Booths
 *     summary: Get a single booth by id
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booth retrieved (results cached for 60 seconds)
 *       404:
 *         description: Booth not found
 */
router.get('/:boothId', controller.getSingleBooth);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths:
 *   post:
 *     tags:
 *       - Booths
 *     summary: Create booth visit log
 *     description: "Log a new booth visit (scans and/or voice notes). All scan data is persisted in MongoDB."
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
 *               description:
 *                 type: string
 *               qrId:
 *                 type: string
 *               scans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     rawText:
 *                       type: string
 *                     extractedFields:
 *                       type: object
 *                       properties:
 *                         name: { type: string }
 *                         company: { type: string }
 *                         title: { type: string }
 *                         phone: { type: string }
 *                         email: { type: string }
 *                         website: { type: string }
 *                         linkedin: { type: string }
 *                         socialMedia:
 *                           type: array
 *                           items: { type: string }
 *                         address: { type: string }
 *                     imageUrl:
 *                       type: string
 *                     driveFileId:
 *                       type: string
 *               voiceNote:
 *                 type: object
 *                 properties:
 *                   transcript: { type: string }
 *                   durationSec: { type: number }
 *     responses:
 *       201:
 *         description: Booth created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Event not found
 */
router.post('/', validate(createBoothSchema), controller.createBooth);

router.use('/:boothId/documents', boothDocumentRoutes);

export default router;
