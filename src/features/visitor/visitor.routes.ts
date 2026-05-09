import { Router } from 'express';
import { VisitorController } from './visitor.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';

const router = Router();
const controller = new VisitorController();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/visitor/scanned-booths:
 *   get:
 *     tags:
 *       - Visitor
 *     summary: List booths the visitor has scanned (read from their "My Scanned Booths" sheet)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scanned booths listed
 */
router.get('/scanned-booths', controller.listScannedBooths);

export default router;
