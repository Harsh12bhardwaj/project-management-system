import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { AppError } from '../utils/appError';

export class TaskController {
  static async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const task = await TaskService.createTask(req.user.id, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Task created successfully',
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const tasks = await TaskService.listTasks(req.user.id, req.query);
      res.status(200).json({
        status: 'success',
        results: tasks.length,
        data: { tasks },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const task = await TaskService.getTaskById(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const task = await TaskService.updateTask(
        req.user.id,
        req.params.id,
        req.body
      );
      res.status(200).json({
        status: 'success',
        message: 'Task updated successfully',
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      await TaskService.deleteTask(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
