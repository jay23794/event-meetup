import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { validate } from '@/middleware/validate.middleware';
import { createEventWithBoothAndDocumentsSchema } from '@/types/zod/exhibitorBooth.schema';

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
router.get('/',listEvents);

/**
 * @swagger
 * /api/v1/exhibitor/events/create-with-booth-and-documents:
 *   post:
 *     tags:
 *       - Exhibitor Events
 *     summary: Create event + booth + documents in a single call
 *     description: "Combines event creation (with Drive folder setup) and booth creation with extracted documents (Anthropic structuring + Mongo persistence) into one atomic-ish call."
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventName
 *               - boothName
 *               - description
 *               - documents
 *             properties:
 *               eventName:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               boothName:
 *                 type: string
 *               description:
 *                 type: string
 *               documents:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Event, booth and documents created
 *       400:
 *         description: Validation error
 *       412:
 *         description: Google account not connected
 *       502:
 *         description: Extraction failed
 */
// router.post(
//   '/create-with-booth-and-documents',
//   validate(createEventWithBoothAndDocumentsSchema),
//  createEventWithBoothAndDocuments
// );

export default router;
