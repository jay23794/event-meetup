import { googleAuth, googleAuthCallback } from '@/controller/auth.controller';
import { Router } from 'express';


const router = Router();

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
router.get('/google',googleAuth);

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
 *       302:
 *         description: Redirect to frontend with JWT or error
 */
router.get('/google/callback', googleAuthCallback);

export default router;
