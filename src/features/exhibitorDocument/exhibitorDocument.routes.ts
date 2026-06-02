import { Router } from 'express';
import { ExhibitorDocumentController } from './exhibitorDocument.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import { createExhibitorDocumentSchema, extractDocumentSchema } from './exhibitorDocument.schema';

const router = Router({ mergeParams: true });
const controller = new ExhibitorDocumentController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/exhibitor/booths/{boothId}/documents:
 *   post:
 *     tags:
 *       - Exhibitor Booths
 *     summary: Add a document to an exhibitor booth
 *     description: "Exhibitor booth setup — separate from visitor scan flow. Attaches a Drive file (card or brochure) to the booth and increments the booth's documentCount."
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
 *             required:
 *               - driveFileId
 *               - driveFileUrl
 *               - fileName
 *               - fileType
 *             properties:
 *               driveFileId:
 *                 type: string
 *               driveFileUrl:
 *                 type: string
 *                 format: uri
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
 *           examples:
 *             example1:
 *               value:
 *                 driveFileId: "1aBcDeFgHiJkLmNoPqRsT"
 *                 driveFileUrl: "https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsT/view"
 *                 fileName: "AcmeBrochure.pdf"
 *                 fileType: "brochure"
 *                 mimeType: "application/pdf"
 *                 sizeBytes: 184320
 *                 isPublic: true
 *     responses:
 *       201:
 *         description: Exhibitor document created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Exhibitor booth not found
 */
router.post(
  '/booths/:boothId/documents',
  validate(createExhibitorDocumentSchema),
  controller.createDocument
);

/**
 * @swagger
 * /api/v1/exhibitor/booths/{boothId}/documents:
 *   get:
 *     tags:
 *       - Exhibitor Booths
 *     summary: List documents for an exhibitor booth
 *     description: "Exhibitor booth setup — separate from visitor scan flow. Lists card and brochure documents attached to the booth."
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65b2c3d4e5f6a7b8c9d0e1a2"
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *           enum: [card, brochure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exhibitor documents listed
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Exhibitor booth not found
 */
router.get('/booths/:boothId/documents', controller.listByBooth);

/**
 * @swagger
 * /api/v1/exhibitor/booths/{boothId}/documents/{docId}:
 *   delete:
 *     tags:
 *       - Exhibitor Booths
 *     summary: Delete an exhibitor booth document
 *     description: "Exhibitor booth setup — separate from visitor scan flow. Removes the document record from MongoDB and decrements the booth's documentCount. Does NOT delete the underlying Drive file."
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65b2c3d4e5f6a7b8c9d0e1a2"
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65c3d4e5f6a7b8c9d0e1a2b3"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exhibitor document deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document or booth not found
 */
router.delete('/booths/:boothId/documents/:docId', controller.deleteDocument);

/**
 * @swagger
 * /api/v1/exhibitor/booths/{boothId}/documents/{docId}/extract:
 *   post:
 *     tags:
 *       - Exhibitor Booths
 *     summary: Extract and structure text from an exhibitor document
 *     description: "Accepts raw OCR text, structures it with Anthropic API, and saves to MongoDB."
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65b2c3d4e5f6a7b8c9d0e1a2"
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65c3d4e5f6a7b8c9d0e1a2b3"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rawText
 *             properties:
 *               rawText:
 *                 type: string
 *                 description: Raw OCR text extracted from the document
 *           example:
 *             rawText: "John Doe\nAcme Corp\nSoftware Engineer\n+91-9876-543210\njohn@acme.com\nwww.acme.com"
 *     responses:
 *       200:
 *         description: Document extraction successful
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document or booth not found
 *       412:
 *         description: Google account not connected
 *       502:
 *         description: Extraction failed
 */
router.post(
  '/booths/:boothId/documents/:docId/extract',
  validate(extractDocumentSchema),
  controller.extractDocument
);

export default router;
