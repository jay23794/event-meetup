import pino from 'pino';
import { config } from '@/config/env';

const transport = config.NODE_ENV === 'production'
  ? pino.transport({
      target: 'pino/file',
      options: { destination: 1 },
    })
  : pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: false,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    });

export const logger = pino(
  {
    level: config.LOG_LEVEL,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);
