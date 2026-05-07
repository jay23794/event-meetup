import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '@/shared/middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authMiddleware, controller.logout);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Initiate Google OAuth flow
 *     responses:
 *       302:
 *         description: Redirect to Google consent screen
 */
router.get('/google', controller.googleAuth);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Handle Google OAuth callback
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from Google
 *     responses:
 *       200:
 *         description: Authorization successful, returns refresh token
 *       302:
 *         description: Redirect on error
 */
router.get('/google/callback', controller.googleAuthCallback);

export default router;
