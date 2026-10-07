import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { AppError } from '../utils/appError';

export class ProjectController {
  static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const project = await ProjectService.createProject(req.user.id, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Project created successfully',
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const projects = await ProjectService.listProjects(req.user.id, req.query);
      res.status(200).json({
        status: 'success',
        results: projects.length,
        data: { projects },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const project = await ProjectService.getProjectById(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      const project = await ProjectService.updateProject(
        req.user.id,
        req.params.id,
        req.body
      );
      res.status(200).json({
        status: 'success',
        message: 'Project updated successfully',
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('Authentication required', 401);
      }

      await ProjectService.deleteProject(req.user.id, req.params.id);
      res.status(200).json({
        status: 'success',
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
