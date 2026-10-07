import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectByIdSchema,
  listProjectsSchema,
} from '../validators/project.validation';

export const projectRouter = Router();

// Protect all project routes with JWT authentication
projectRouter.use(authenticate);

projectRouter.post(
  '/',
  validateRequest(createProjectSchema),
  ProjectController.createProject
);

projectRouter.get(
  '/',
  validateRequest(listProjectsSchema),
  ProjectController.listProjects
);

projectRouter.get(
  '/:id',
  validateRequest(getProjectByIdSchema),
  ProjectController.getProjectById
);

projectRouter.put(
  '/:id',
  validateRequest(updateProjectSchema),
  ProjectController.updateProject
);

projectRouter.delete(
  '/:id',
  validateRequest(getProjectByIdSchema),
  ProjectController.deleteProject
);
