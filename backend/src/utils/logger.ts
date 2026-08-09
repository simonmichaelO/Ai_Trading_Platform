/**
 * Winston Logger Configuration
 * 
 * Structured logging for the entire backend.
 * - Development: colorized console output for readability
 * - Production: JSON format for log aggregation services
 * 
 * Usage:
 *   import { logger } from '@utils/logger';
 *   logger.info('Server started', { port: 5000 });
 *   logger.error('Database connection failed', { error });
 */

import winston from 'winston';
import config from '@config/index';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom development format — readable in terminal
const devFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  // Include additional metadata if present
  const metaKeys = Object.keys(metadata);
  if (metaKeys.length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  // Include stack trace for errors
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Select format based on environment
const logFormat = config.server.isProduction
  ? combine(timestamp(), errors({ stack: true }), json())
  : combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      devFormat
    );

export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new winston.transports.Console(),
  ],
  // Don't exit on unhandled exceptions — log and let process manager restart
  exitOnError: false,
});

export default logger;
