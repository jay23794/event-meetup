import { Router } from 'express';
import { EventController } from '../event/event.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import { createEventSchema } from '../event/event.schema';

const router = Router();
const controller = new EventController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/exhibitor/events:
 *   get:
 *     tags:
 *       - Exhibitor Events
 *     summary: List exhibitor's events
 *     description: "List all events owned by the authenticated exhibitor"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events listed
 *       401:
 *         description: Unauthorized
 */
router.get('/', controller.listEvents);

/**
 * @swagger
 * /api/v1/exhibitor/events:
 *   post:
 *     tags:
 *       - Exhibitor Events
 *     summary: Create new exhibitor event
 *     description: "Create a new event to set up booth(s) for an exhibition"
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
 */
router.post('/', validate(createEventSchema), controller.createEvent);

/**
 * @swagger
 * /api/v1/exhibitor/events/{id}:
 *   get:
 *     tags:
 *       - Exhibitor Events
 *     summary: Get exhibitor event by ID
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

export default router;
