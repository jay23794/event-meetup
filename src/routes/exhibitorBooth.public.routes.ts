import { getBoothByQrId, listPublicDocuments } from '@/controller/exhibitorBooth.controller';
import { Router } from 'express';

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
router.get('/:qrId', getBoothByQrId);

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
router.get('/:qrId/documents', listPublicDocuments);


export default router;
