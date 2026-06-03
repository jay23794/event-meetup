import mongoose from 'mongoose';
import { config } from '@/config/env';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error(error, 'Failed to connect MongoDB');
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(error, 'Failed to disconnect MongoDB');
  }
};

mongoose.connection.on('error', (error) => {
  logger.error(error, 'MongoDB connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
