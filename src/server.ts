import '@/config/load-env';
import { config } from '@/config/env';
import { logger } from '@/infra/logger';
import { connectDB, disconnectDB } from '@/infra/db';
import app from './app';

const startServer = async (): Promise<void> => {
  try {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Starting server');

    await connectDB();

    const server = app.listen(config.PORT,"0.0.0.0" ,() => {
      logger.info(`Server running at http://localhost:${config.PORT}`);
      logger.info(`Swagger docs at http://localhost:${config.PORT}/docs`);
    });

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      server.close(async () => {
        await disconnectDB();
        logger.info('Server shut down');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error: Error) => {
      logger.error(error, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error({ reason }, 'Unhandled rejection');
      process.exit(1);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
