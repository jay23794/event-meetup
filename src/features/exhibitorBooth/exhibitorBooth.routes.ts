import { Router } from 'express';
import { ExhibitorBoothController } from './exhibitorBooth.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import {
  createExhibitorBoothSchema,
  updateExhibitorBoothSchema,
} from './exhibitorBooth.schema';

const router = Router({ mergeParams: true });
const controller = new ExhibitorBoothController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/exhibitor/events/{eventId}/booths:
 *   post:
 *     tags:
 *       - Exhibitor Booths
 *     summary: Create an exhibitor booth
 *     description: "Exhibitor booth setup — separate from visitor scan flow. Exhibitor creates their booth with name and description, server generates a unique QR code for the booth."
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65a1b2c3d4e5f6a7b8c9d0e1"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - boothName
 *               - description
 *             properties:
 *               boothName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *           examples:
 *             example1:
 *               value:
 *                 boothName: "Acme Innovations"
 *                 description: "Showcasing our new line of IoT smart sensors and edge AI hardware."
 *     responses:
 *       201:
 *         description: Exhibitor booth created
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
 *                     booth:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         ownerUserId:
 *                           type: string
 *                         eventId:
 *                           type: string
 *                         boothName:
 *                           type: string
 *                         description:
 *                           type: string
 *                         qrId:
 *                           type: string
 *                         qrUrl:
 *                           type: string
 *                         documentCount:
 *                           type: number
 *                         scanCount:
 *                           type: number
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - user does not own the event
 *       404:
 *         description: Event not found
 */
router.post('/events/:eventId/booths', validate(createExhibitorBoothSchema), controller.createBooth);

/**
 * @swagger
 * /api/v1/exhibitor/events/{eventId}/booths:
 *   get:
 *     tags:
 *       - Exhibitor Booths
 *     summary: List exhibitor booths for an event
 *     description: "Exhibitor booth setup — separate from visitor scan flow. Lists all exhibitor booths the user has set up for the given event."
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
 *         description: Exhibitor booths listed
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
 *                     booths:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           boothName:
 *                             type: string
 *                           description:
 *                             type: string
 *                           qrId:
 *                             type: string
 *                           qrUrl:
 *                             type: string
 *                           documentCount:
 *                             type: number
 *                           scanCount:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.get('/events/:eventId/booths', controller.listByEvent);

/**
 * @swagger
 * /api/v1/exhibitor/booths/{boothId}:
 *   get:
 *     tags:
 *       - Exhibitor Booths
 *     summary: Get an exhibitor booth by id
 *     description: "Exhibitor booth setup — separate from visitor scan flow. Returns the exhibitor booth with its QR info."
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65b2c3d4e5f6a7b8c9d0e1a2"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exhibitor booth retrieved
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Exhibitor booth not found
 */
router.get('/booths/:boothId', controller.getBooth);

/**
 * @swagger
 * /api/v1/exhibitor/booths/{boothId}:
 *   patch:
 *     tags:
 *       - Exhibitor Booths
 *     summary: Update an exhibitor booth
 *     description: "Exhibitor booth setup — separate from visitor scan flow. Only boothName and description can be updated; qrId and qrUrl are immutable."
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65b2c3d4e5f6a7b8c9d0e1a2"
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
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *           examples:
 *             example1:
 *               value:
 *                 boothName: "Acme Innovations (Updated)"
 *                 description: "Updated booth description."
 *     responses:
 *       200:
 *         description: Exhibitor booth updated
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Exhibitor booth not found
 */
router.patch('/booths/:boothId', validate(updateExhibitorBoothSchema), controller.updateBooth);

export default router;
