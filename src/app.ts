import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { nanoid } from 'nanoid';
import { logger } from '@/infra/logger';
import { swaggerSpec } from '@/libs/swagger';
import { globalLimiter } from '@/middleware/rateLimit.middleware';
import { errorHandler } from '@/errors/app.error.handler';
import { NotFoundError } from '@/errors';
import { ApiResponse } from '@/utils/ApiResponse';
import authRoutes from '@/routes/auth.routes';
import exhibitorEventRoutes from '@/routes/event.route';
import exhibitorBoothRoutes from '@/routes/exhibitorBooth.routes';
import exhibitorBoothPublicRoutes from '@/routes/exhibitorBooth.public.routes';
import exhibitorDocumentRoutes from '@/routes/exhibitorDocument.routes';
import visitorRoutes from '@/routes/visitor.routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://www.googleapis.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
}));
app.use(cors());
app.use(compression());
app.use(globalLimiter);

app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestId = nanoid();
  logger.info({ requestId: req.requestId, method: req.method, url: req.url });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                     status:
 *                       type: string
 *                     uptime:
 *                       type: number
 *                     db:
 *                       type: string
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(
    ApiResponse.success({
      status: 'ok',
      uptime: process.uptime(),
      db: 'connected',
    })
  );
});

// Public routes (no auth required) — mounted at both paths so frontend (with /api/v1 baseURL) and direct calls both work
app.use('/public/exhibitor-booths', exhibitorBoothPublicRoutes);
app.use('/api/v1/public/exhibitor-booths', exhibitorBoothPublicRoutes);

// Protected routes
app.use('/api/v1/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api/v1/exhibitor/events', exhibitorEventRoutes);
app.use('/api/v1/exhibitor', exhibitorBoothRoutes);
app.use('/api/v1/exhibitor', exhibitorDocumentRoutes);
app.use('/api/v1/visitor', visitorRoutes);

// Static legal pages — served from public/<slug>/index.html as plain HTML so
// search engines and OAuth verification crawlers see real content without
// executing JS. Must be declared BEFORE the SPA catch-all. The directory/
// index.html layout also lets any static-site host (Render, Netlify, etc.)
// match these before falling through to the SPA rewrite.
app.get(['/privacy-policy', '/terms'], (req: Request, res: Response) => {
  const slug = req.path === '/terms' ? 'terms' : 'privacy-policy';
  const filePath = path.join(__dirname, '../public', slug, 'index.html');
  if (existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json(ApiResponse.error('Page not found'));
  }
});

// SPA fallback: serve index.html for any non-API GET routes
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json(ApiResponse.error('Route not found'));
  }
});

// 404 trap — anything that fell through the routes and SPA wildcard
// (e.g. non-GET requests to unknown paths) is funnelled into the error handler.
app.use((req, _res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
});

app.use(errorHandler);

export default app;
