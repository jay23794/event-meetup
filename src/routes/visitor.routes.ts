import { Router } from 'express';
import { visitorController as controller } from '@/controller/visitor.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/visitor/scanned-booths:
 *   get:
 *     tags:
 *       - Visitor
 *     summary: List booths the visitor has scanned
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scanned booths listed
 */
router.get('/scanned-booths', controller.listScannedBooths);

export default router;
