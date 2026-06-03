import { Router } from 'express';
import { ExhibitorBoothController } from './exhibitorBooth.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';

const router = Router({ mergeParams: true });
const controller = new ExhibitorBoothController();

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
router.get('/events/:eventId/booths', controller.listByEvent);

export default router;
