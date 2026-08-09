/**
 * Server Entry Point
 * 
 * Initializes Express with all middleware, routes, and error handling.
 * This is the ONLY file that bootstraps the application.
 * 
 * Architecture:
 *   Request → Middleware → Routes → Controllers → Services → Repositories → Database
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import strategyRoutes from './routes/strategy.routes';
import preferencesRoutes from './routes/preferences.routes';
import watchlistRoutes from './routes/watchlist.routes';
import marketRoutes from './routes/market.routes';
import analysisRoutes from './routes/analysis.routes';
import tradeRoutes from './routes/trade.routes';

// ──────────────────────────────────────────────
// Create Express application
// ──────────────────────────────────────────────
const app: Application = express();

// ──────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ──────────────────────────────────────────────

// Helmet — sets secure HTTP headers (XSS protection, CSP, etc.)
app.use(helmet());

// CORS — only allow requests from the configured frontend origin
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ──────────────────────────────────────────────
// RATE LIMITING
// ──────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.server.isProduction ? 100 : 1000, // generous in dev, strict in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes',
  },
});

app.use('/api/', limiter);

// ──────────────────────────────────────────────
// BODY PARSING & COMPRESSION
// ──────────────────────────────────────────────

// Parse JSON bodies (limit size to prevent abuse)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compress responses (gzip)
app.use(compression());

// ──────────────────────────────────────────────
// REQUEST LOGGING
// ──────────────────────────────────────────────

// Morgan HTTP request logging (only in development)
if (config.server.isDevelopment) {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// HEALTH CHECK (no auth required)
// ──────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.env,
    version: '1.0.0',
  });
});

// ──────────────────────────────────────────────
// API ROUTES
// ──────────────────────────────────────────────

// Mount API routes under the versioned prefix
// Routes will be added here as we build each feature module
const apiRouter = express.Router();

// Health check for API specifically
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount feature routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/strategies', strategyRoutes);
apiRouter.use('/preferences', preferencesRoutes);
apiRouter.use('/watchlist', watchlistRoutes);
apiRouter.use('/market', marketRoutes);
apiRouter.use('/analysis', analysisRoutes);
apiRouter.use('/trades', tradeRoutes);

app.use(config.server.apiPrefix, apiRouter);

// ──────────────────────────────────────────────
// 404 HANDLER — catch unmatched routes
// ──────────────────────────────────────────────

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    path: req.path,
  });
});

// ──────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ──────────────────────────────────────────────

/**
 * Centralized error handler.
 * All errors thrown or passed via next(err) end up here.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
  });

  // Don't leak stack traces in production
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: config.server.isProduction ? 'Internal Server Error' : err.message,
    ...(config.server.isDevelopment && { stack: err.stack }),
  });
});

// ──────────────────────────────────────────────
// START SERVER
// ──────────────────────────────────────────────

const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`🚀 Server is running`, {
    port: PORT,
    env: config.server.env,
    apiPrefix: config.server.apiPrefix,
    cors: config.cors.origin,
  });

  if (config.server.isDevelopment) {
    logger.info(`📡 Health check: http://localhost:${PORT}/health`);
    logger.info(`📡 API health:  http://localhost:${PORT}${config.server.apiPrefix}/health`);
  }
});

// ──────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ──────────────────────────────────────────────

/**
 * Handle SIGTERM/SIGINT for clean shutdowns (important for Docker, Railway, etc.)
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
