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
 *     summary: List exhibitor booths for an event
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exhibitor booths listed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.get('/events/:eventId/booths', listByEvent);

export default router;
