import { Router } from 'express';
import { BoothController } from './booth.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { validate } from '@/shared/middleware/validate.middleware';
import { createBoothSchema } from './booth.schema';
import boothDocumentRoutes from '@/features/boothDocument/boothDocument.routes';

const router = Router({ mergeParams: true });
const controller = new BoothController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths:
 *   get:
 *     tags:
 *       - Booths
 *     summary: List booths for an event
 *     description: "List all booth visits logged for an event"
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65a1b2c3d4e5f6a7b8c9d0e1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *           maximum: 200
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: number
 *           description: Row number to start from (default starts at row 2)
 *           example: 2
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booths listed (results cached for 60 seconds)
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
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           boothName:
 *                             type: string
 *                           scanCount:
 *                             type: number
 *                           names:
 *                             type: string
 *                           phones:
 *                             type: string
 *                           emails:
 *                             type: string
 *                           companies:
 *                             type: string
 *                           rawOcr:
 *                             type: string
 *                           voiceTranscript:
 *                             type: string
 *                           imageUrls:
 *                             type: string
 *                     nextCursor:
 *                       type: number
 *                       nullable: true
 *                     total:
 *                       type: number
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     booths:
 *                       - timestamp: "2026-05-07T10:15:30Z"
 *                         boothName: "TechCorp Booth"
 *                         scanCount: 1
 *                         names: "John Smith; Sarah Johnson"
 *                         phones: "+1-555-0101; +1-555-0102"
 *                         emails: "john@example.com; sarah@example.com"
 *                         companies: "TechCorp; Innovation Labs"
 *                         rawOcr: "[{\"text\":\"JOHN SMITH\",\"confidence\":0.95}]"
 *                         voiceTranscript: "Spoke with John about cloud solutions"
 *                         imageUrls: "https://example.com/image1.jpg; https://example.com/image2.jpg"
 *                       - timestamp: "2026-05-07T11:20:45Z"
 *                         boothName: "StartupHub"
 *                         scanCount: 2
 *                         names: "Mike Chen"
 *                         phones: "+1-555-0201"
 *                         emails: "mike@startup.com"
 *                         companies: "StartupHub Inc"
 *                         rawOcr: "[{\"text\":\"MIKE CHEN\",\"confidence\":0.92}]"
 *                         voiceTranscript: null
 *                         imageUrls: "https://example.com/image3.jpg"
 *                     nextCursor: null
 *                     total: 2
 *       404:
 *         description: Event not found
 */
router.get('/', controller.listBooths);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths/{rowNumber}:
 *   get:
 *     tags:
 *       - Booths
 *     summary: Get a single booth by row number
 *     description: "Retrieve details of a specific booth visit"
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           example: "65a1b2c3d4e5f6a7b8c9d0e1"
 *       - in: path
 *         name: rowNumber
 *         required: true
 *         schema:
 *           type: number
 *           example: 2
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booth retrieved (results cached for 60 seconds)
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
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         boothName:
 *                           type: string
 *                         scanCount:
 *                           type: number
 *                         names:
 *                           type: string
 *                         phones:
 *                           type: string
 *                         emails:
 *                           type: string
 *                         companies:
 *                           type: string
 *                         rawOcr:
 *                           type: string
 *                         voiceTranscript:
 *                           type: string
 *                         imageUrls:
 *                           type: string
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     booth:
 *                       timestamp: "2026-05-07T10:15:30Z"
 *                       boothName: "TechCorp Booth"
 *                       scanCount: 1
 *                       names: "John Smith; Sarah Johnson"
 *                       phones: "+1-555-0101; +1-555-0102"
 *                       emails: "john@example.com; sarah@example.com"
 *                       companies: "TechCorp; Innovation Labs"
 *                       rawOcr: "[{\"text\":\"JOHN SMITH\",\"confidence\":0.95},{\"text\":\"SARAH JOHNSON\",\"confidence\":0.93}]"
 *                       voiceTranscript: "Spoke with John about cloud solutions and Sarah about enterprise plans"
 *                       imageUrls: "https://example.com/image1.jpg; https://example.com/image2.jpg"
 *       404:
 *         description: Booth not found
 */
router.get('/:rowNumber', controller.getSingleBooth);

/**
 * @swagger
 * /api/v1/events/{eventId}/booths:
 *   post:
 *     tags:
 *       - Booths
 *     summary: Create booth and append to event sheet
 *     description: "Log a new booth visit (scans and/or voice notes). First booth creation triggers Google Sheet initialization."
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
 *             properties:
 *               boothName:
 *                 type: string
 *               scans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ocrText:
 *                       type: string
 *                     extractedFields:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         company:
 *                           type: string
 *                         title:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         website:
 *                           type: string
 *                         address:
 *                           type: string
 *                     imageUrl:
 *                       type: string
 *               voiceNote:
 *                 type: object
 *                 properties:
 *                   transcript:
 *                     type: string
 *                   durationSec:
 *                     type: number
 *           examples:
 *             example1:
 *               summary: Booth with scans and voice note
 *               value:
 *                 boothName: "Google Booth"
 *                 scans:
 *                   - ocrText: "JOHN SMITH\nGoogle LLC\nSoftware Engineer\njohn.smith@google.com\n+1-555-0101"
 *                     extractedFields:
 *                       name: "John Smith"
 *                       company: "Google LLC"
 *                       title: "Software Engineer"
 *                       email: "john.smith@google.com"
 *                       phone: "+1-555-0101"
 *                       website: "https://google.com"
 *                     imageUrl: "https://example.com/scan1.jpg"
 *                 voiceNote:
 *                   transcript: "Discussed cloud infrastructure and AI solutions"
 *                   durationSec: 45
 *             example2:
 *               summary: Booth with multiple scans, no voice note
 *               value:
 *                 boothName: "Tech Startup Hub"
 *                 scans:
 *                   - ocrText: "SARAH JOHNSON\nStartup X\nCEO\nsarah@startupx.com\n+1-555-0201"
 *                     extractedFields:
 *                       name: "Sarah Johnson"
 *                       company: "Startup X"
 *                       title: "CEO"
 *                       email: "sarah@startupx.com"
 *                       phone: "+1-555-0201"
 *                     imageUrl: "https://example.com/scan2.jpg"
 *                   - ocrText: "MIKE CHEN\nStartup X\nCTO\nmike@startupx.com\n+1-555-0202"
 *                     extractedFields:
 *                       name: "Mike Chen"
 *                       company: "Startup X"
 *                       title: "CTO"
 *                       email: "mike@startupx.com"
 *                       phone: "+1-555-0202"
 *                     imageUrl: "https://example.com/scan3.jpg"
 *     responses:
 *       201:
 *         description: Booth created and appended to sheet
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
 *                     boothId:
 *                       type: string
 *                     sheetRowNumber:
 *                       type: number
 *             examples:
 *               application/json:
 *                 value:
 *                   success: true
 *                   data:
 *                     boothId: "65b2c3d4e5f6a7b8c9d0e1a2"
 *                     sheetRowNumber: 2
 *       400:
 *         description: Validation error
 *       404:
 *         description: Event not found
 *       412:
 *         description: Google account not connected
 */
router.post('/', validate(createBoothSchema), controller.createBooth);

router.use('/:boothId/documents', boothDocumentRoutes);

export default router;
