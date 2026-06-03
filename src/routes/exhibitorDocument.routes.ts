import { Router } from 'express';
import { exhibitorDocumentController as controller } from '@/controller/exhibitorDocument.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/exhibitor/booths/{boothId}/documents:
 *   get:
 *     tags:
 *       - Exhibitor Booths
 *     summary: List documents for an exhibitor booth
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *           enum: [card, brochure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exhibitor documents listed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Exhibitor booth not found
 */
router.get('/booths/:boothId/documents', controller.listByBooth);

export default router;
