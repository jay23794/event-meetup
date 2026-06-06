import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { listEvents } from '@/controller/event.controller';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/exhibitor/events:
 *   get:
 *     tags:
 *       - Exhibitor Events
 *     summary: List exhibitor's events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events listed
 *       401:
 *         description: Unauthorized
 */
router.get('/', listEvents);

export default router;
