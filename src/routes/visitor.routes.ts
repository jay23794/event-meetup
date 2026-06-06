import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth.middleware';
import { listScannedBooths } from '@/controller/visitor.controller';

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
router.get('/scanned-booths', listScannedBooths);

export default router;
