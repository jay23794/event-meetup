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
 *                         properties:
 *                           _id:
 *                             type: string
 *                           ownerUserId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                           sheetId:
 *                             type: string
 *                           sheetUrl:
 *                             type: string
 *                           sheetCreated:
 *                             type: boolean
 *                           boothCount:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     events:
 *                       - _id: "65a1b2c3d4e5f6a7b8c9d0e1"
 *                         ownerUserId: "65a1b2c3d4e5f6a7b8c9d0e2"
 *                         name: "Tech Conference 2026"
 *                         startDate: "2026-06-15T09:00:00Z"
 *                         endDate: "2026-06-17T17:00:00Z"
 *                         sheetId: "1a2b3c4d5e6f7a8b9c0d1e2f"
 *                         sheetUrl: "https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7a8b9c0d1e2f"
 *                         sheetCreated: true
 *                         boothCount: 12
 *                         createdAt: "2026-05-01T10:00:00Z"
 *                         updatedAt: "2026-05-07T15:30:00Z"
 *                       - _id: "65a1b2c3d4e5f6a7b8c9d0e3"
 *                         ownerUserId: "65a1b2c3d4e5f6a7b8c9d0e2"
 *                         name: "Product Summit 2026"
 *                         startDate: "2026-07-10T09:00:00Z"
 *                         endDate: "2026-07-12T17:00:00Z"
 *                         sheetId: null
 *                         sheetUrl: null
 *                         sheetCreated: false
 *                         boothCount: 0
 *                         createdAt: "2026-05-03T14:20:00Z"
 *                         updatedAt: "2026-05-03T14:20:00Z"
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
 *           examples:
 *             example1:
 *               value:
 *                 name: "Annual Expo 2026"
 *                 startDate: "2026-08-20T09:00:00Z"
 *                 endDate: "2026-08-22T17:00:00Z"
 *     responses:
 *       201:
 *         description: Event created
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
 *                     _id:
 *                       type: string
 *                     ownerUserId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     sheetCreated:
 *                       type: boolean
 *                     boothCount:
 *                       type: number
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "65a1b2c3d4e5f6a7b8c9d0e4"
 *                     ownerUserId: "65a1b2c3d4e5f6a7b8c9d0e2"
 *                     name: "Annual Expo 2026"
 *                     startDate: "2026-08-20T09:00:00Z"
 *                     endDate: "2026-08-22T17:00:00Z"
 *                     sheetCreated: false
 *                     boothCount: 0
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
 *           example: "65a1b2c3d4e5f6a7b8c9d0e1"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event retrieved
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
 *                     _id:
 *                       type: string
 *                     ownerUserId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     sheetId:
 *                       type: string
 *                     sheetUrl:
 *                       type: string
 *                     sheetCreated:
 *                       type: boolean
 *                     boothCount:
 *                       type: number
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     _id: "65a1b2c3d4e5f6a7b8c9d0e1"
 *                     ownerUserId: "65a1b2c3d4e5f6a7b8c9d0e2"
 *                     name: "Tech Conference 2026"
 *                     startDate: "2026-06-15T09:00:00Z"
 *                     endDate: "2026-06-17T17:00:00Z"
 *                     sheetId: "1a2b3c4d5e6f7a8b9c0d1e2f"
 *                     sheetUrl: "https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7a8b9c0d1e2f"
 *                     sheetCreated: true
 *                     boothCount: 12
 *       404:
 *         description: Event not found
 */
router.get('/:id', controller.getEvent);

/**
 * @swagger
 * /api/v1/events/{eventId}/summary:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get event summary with booth statistics
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65a1b2c3d4e5f6a7b8c9d0e1"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event summary retrieved (results cached for 60 seconds)
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
 *                     totalBooths:
 *                       type: number
 *                     totalScans:
 *                       type: number
 *                     uniqueCompanies:
 *                       type: number
 *                     uniquePhones:
 *                       type: number
 *                     boothsWithVoiceNote:
 *                       type: number
 *                     lastBoothAt:
 *                       type: string
 *                       nullable: true
 *                       format: date-time
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     totalBooths: 12
 *                     totalScans: 34
 *                     uniqueCompanies: 8
 *                     uniquePhones: 10
 *                     boothsWithVoiceNote: 7
 *                     lastBoothAt: "2026-05-07T15:45:30Z"
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/summary', controller.getSummary);

router.use('/:eventId/booths', boothRoutes);

export default router;
