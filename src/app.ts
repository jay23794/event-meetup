import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { nanoid } from 'nanoid';
import { config } from './config/env';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { globalLimiter } from './shared/middleware/rateLimit.middleware';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { ApiResponse } from './shared/utils/ApiResponse';
import authRoutes from './features/auth/auth.routes';
import eventRoutes from './features/event/event.routes';
import scanRoutes from './features/scan/scan.routes';
import exhibitorEventRoutes from './features/exhibitorEvent/exhibitorEvent.routes';
import exhibitorBoothRoutes from './features/exhibitorBooth/exhibitorBooth.routes';
import exhibitorDocumentRoutes from './features/exhibitorDocument/exhibitorDocument.routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet());
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

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/exhibitor/events', exhibitorEventRoutes);
app.use('/api/v1/exhibitor', exhibitorBoothRoutes);
app.use('/api/v1/exhibitor', exhibitorDocumentRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json(ApiResponse.error('Route not found'));
});

app.use(errorMiddleware);

export default app;
