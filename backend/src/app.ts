import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter, authLimiter } from './middlewares/rateLimiter';
import { authRouter } from './routes/auth.routes';
import { projectRouter } from './routes/project.routes';
import { taskRouter } from './routes/task.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { AppError } from './utils/appError';

export const createApp = (): Application => {
  const app: Application = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // HTTP Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Global rate limiter
  app.use('/api', apiLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication Routes
  app.use('/api/auth', authLimiter, authRouter);

  // Project Routes
  app.use('/api/projects', projectRouter);

  // Tasks Routes
  app.use('/api/tasks', taskRouter);

  // Dashboard Routes
  app.use('/api/dashboard', dashboardRouter);

  // Handle unmatched 404 routes
  app.all('*', (req: Request) => {
    throw new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404);
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
