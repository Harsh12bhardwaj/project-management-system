import { query } from '../config/database';
import { AppError } from '../utils/appError';
import {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from '../validators/project.validation';

export interface ProjectResponse {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectService {
  static async createProject(
    userId: string,
    input: CreateProjectInput
  ): Promise<ProjectResponse> {
    const { name, description, status, startDate, endDate } = input;

    const result = await query<ProjectResponse>(
      `INSERT INTO projects (user_id, name, description, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING 
         id, 
         user_id as "userId", 
         name, 
         description, 
         status, 
         start_date as "startDate", 
         end_date as "endDate", 
         created_at as "createdAt", 
         updated_at as "updatedAt"`,
      [
        userId,
        name,
        description || null,
        status || 'NOT_STARTED',
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null,
      ]
    );

    return result.rows[0];
  }

  static async listProjects(
    userId: string,
    filters: ListProjectsQuery
  ): Promise<ProjectResponse[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    const sql = `
      SELECT 
        id, 
        user_id as "userId", 
        name, 
        description, 
        status, 
        start_date as "startDate", 
        end_date as "endDate", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM projects
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const result = await query<ProjectResponse>(sql, params);
    return result.rows;
  }

  static async getProjectById(
    userId: string,
    projectId: string
  ): Promise<ProjectResponse> {
    const result = await query<ProjectResponse>(
      `SELECT 
         id, 
         user_id as "userId", 
         name, 
         description, 
         status, 
         start_date as "startDate", 
         end_date as "endDate", 
         created_at as "createdAt", 
         updated_at as "updatedAt"
       FROM projects
       WHERE id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    const project = result.rows[0];
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return project;
  }

  static async updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<ProjectResponse> {
    // Check if project exists and belongs to the user
    await this.getProjectById(userId, projectId);

    const updates: string[] = [];
    const params: any[] = [projectId, userId];

    if (input.name !== undefined) {
      params.push(input.name);
      updates.push(`name = $${params.length}`);
    }

    if (input.description !== undefined) {
      params.push(input.description || null);
      updates.push(`description = $${params.length}`);
    }

    if (input.status !== undefined) {
      params.push(input.status);
      updates.push(`status = $${params.length}`);
    }

    if (input.startDate !== undefined) {
      params.push(input.startDate ? new Date(input.startDate) : null);
      updates.push(`start_date = $${params.length}`);
    }

    if (input.endDate !== undefined) {
      params.push(input.endDate ? new Date(input.endDate) : null);
      updates.push(`end_date = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.getProjectById(userId, projectId);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING 
        id, 
        user_id as "userId", 
        name, 
        description, 
        status, 
        start_date as "startDate", 
        end_date as "endDate", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;

    const result = await query<ProjectResponse>(sql, params);
    return result.rows[0];
  }

  static async deleteProject(userId: string, projectId: string): Promise<void> {
    const result = await query(
      `DELETE FROM projects
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [projectId, userId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Project not found', 404);
    }
  }
}
