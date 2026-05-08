import { Router } from 'express';
import { BoothDocumentController } from './boothDocument.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import { createBoothDocumentSchema } from './boothDocument.schema';

const router = Router({ mergeParams: true });
const controller = new BoothDocumentController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths/{boothId}/documents:
 *   post:
 *     tags:
 *       - Booth Documents
 *     summary: Register a Drive-uploaded document for a booth
 *     description: "Upload booth documents (business cards, brochures) from Google Drive"
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driveFileId:
 *                 type: string
 *               driveFileUrl:
 *                 type: string
 *                 format: url
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *                 enum: [card, brochure]
 *               mimeType:
 *                 type: string
 *               sizeBytes:
 *                 type: number
 *               isPublic:
 *                 type: boolean
 *               extractedText:
 *                 type: string
 *             required:
 *               - driveFileId
 *               - driveFileUrl
 *               - fileName
 *               - fileType
 *     responses:
 *       201:
 *         description: Document registered successfully
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
 *                     fileName:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                     driveFileUrl:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booth not found
 *       403:
 *         description: Forbidden - no access to booth
 */
router.post('/', validate(createBoothDocumentSchema), controller.createDocument);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths/{boothId}/documents:
 *   get:
 *     tags:
 *       - Booth Documents
 *     summary: List documents for a booth
 *     description: "Retrieve all uploaded documents for a booth visit"
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *           enum: [card, brochure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents listed
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
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           fileName:
 *                             type: string
 *                           fileType:
 *                             type: string
 *                           driveFileUrl:
 *                             type: string
 *                           mimeType:
 *                             type: string
 *                           sizeBytes:
 *                             type: number
 *                           isPublic:
 *                             type: boolean
 *                           extractedText:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booth not found
 *       403:
 *         description: Forbidden - no access to booth
 */
router.get('/', controller.listDocuments);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths/{boothId}/documents/{docId}:
 *   delete:
 *     tags:
 *       - Booth Documents
 *     summary: Delete a booth document
 *     description: "Remove a document from a booth"
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document deleted
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
 *                     message:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 *       403:
 *         description: Forbidden - no access to document
 */
router.delete('/:docId', controller.deleteDocument);

export default router;
