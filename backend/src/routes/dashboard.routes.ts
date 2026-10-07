import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get('/', DashboardController.getStats);
