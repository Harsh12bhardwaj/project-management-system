import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskByIdSchema,
  listTasksSchema,
} from '../validators/task.validation';

export const taskRouter = Router();

// Require JWT authentication for all task endpoints
taskRouter.use(authenticate);

taskRouter.post(
  '/',
  validateRequest(createTaskSchema),
  TaskController.createTask
);

taskRouter.get(
  '/',
  validateRequest(listTasksSchema),
  TaskController.listTasks
);

taskRouter.get(
  '/:id',
  validateRequest(getTaskByIdSchema),
  TaskController.getTaskById
);

taskRouter.put(
  '/:id',
  validateRequest(updateTaskSchema),
  TaskController.updateTask
);

taskRouter.delete(
  '/:id',
  validateRequest(getTaskByIdSchema),
  TaskController.deleteTask
);
