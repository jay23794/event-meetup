import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { listByEvent } from '@/controller/exhibitorBooth.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/exhibitor/events/{eventId}/booths:
 *   get:
 *     tags:
 *       - Exhibitor Booths
 *     summary: List exhibitor booths for an event (each booth includes its documents)
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *           enum: [card, brochure]
 *         description: Optional filter applied to each booth's documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exhibitor booths listed with embedded documents
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.get('/events/:eventId/booths', listByEvent);

export default router;
