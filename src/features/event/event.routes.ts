import { Router } from 'express';
import { EventController } from './event.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import { createEventSchema } from './event.schema';
import boothRoutes from '@/features/booth/booth.routes';

const router = Router();
const controller = new EventController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     tags:
 *       - Events
 *     summary: List user's events
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events listed
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
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/', controller.listEvents);

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     tags:
 *       - Events
 *     summary: Create new event
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error
 *       412:
 *         description: Google account not connected
 */
router.post('/', validate(createEventSchema), controller.createEvent);

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event retrieved
 *       404:
 *         description: Event not found
 */
router.get('/:id', controller.getEvent);

router.use('/:eventId/booths', boothRoutes);

export default router;
