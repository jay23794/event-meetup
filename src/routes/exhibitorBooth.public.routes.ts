import { Router } from 'express';
import { exhibitorBoothController as controller } from '@/controller/exhibitorBooth.controller';

const router = Router();

/**
 * @swagger
 * /public/exhibitor-booths/{qrId}:
 *   get:
 *     tags:
 *       - Public Exhibitor Booths
 *     summary: Get exhibitor booth by QR ID (public)
 *     description: "Public endpoint to view exhibitor booth details via QR code scan"
 *     parameters:
 *       - in: path
 *         name: qrId
 *         required: true
 *         schema:
 *           type: string
 *           example: "abc123xyz"
 *     responses:
 *       200:
 *         description: Booth retrieved
 *       404:
 *         description: Booth not found
 */
router.get('/:qrId', controller.getBoothByQrId);

/**
 * @swagger
 * /public/exhibitor-booths/{qrId}/documents:
 *   get:
 *     tags:
 *       - Public Exhibitor Booths
 *     summary: Get shared documents for a booth (public)
 *     parameters:
 *       - in: path
 *         name: qrId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents retrieved
 */
router.get('/:qrId/documents', controller.listPublicDocuments);

/**
 * @swagger
 * /public/exhibitor-booths/{qrId}/checkin:
 *   post:
 *     tags:
 *       - Public Exhibitor Booths
 *     summary: Visitor check-in to an exhibitor booth
 *     parameters:
 *       - in: path
 *         name: qrId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in successful
 */
router.post('/:qrId/checkin', controller.checkInVisitor);

export default router;
