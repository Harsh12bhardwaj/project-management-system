import { query } from '../config/database';
import { AppError } from '../utils/appError';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task.validation';

export interface TaskResponse {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TaskService {
  static async createTask(
    userId: string,
    input: CreateTaskInput
  ): Promise<TaskResponse> {
    const { projectId, name, description, priority, status, dueDate } = input;

    // Verify project exists and belongs to the authenticated user
    const projectCheck = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      throw new AppError('Referenced project not found or access denied', 404);
    }

    const result = await query<TaskResponse>(
      `INSERT INTO tasks (project_id, user_id, name, description, priority, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING 
         id, 
         project_id as "projectId", 
         user_id as "userId", 
         name, 
         description, 
         priority, 
         status, 
         due_date as "dueDate", 
         created_at as "createdAt", 
         updated_at as "updatedAt"`,
      [
        projectId,
        userId,
        name,
        description || null,
        priority || 'MEDIUM',
        status || 'PENDING',
        dueDate ? new Date(dueDate) : null,
      ]
    );

    return result.rows[0];
  }

  static async listTasks(
    userId: string,
    filters: ListTasksQuery
  ): Promise<TaskResponse[]> {
    const conditions: string[] = ['user_id = $1'];
    const params: any[] = [userId];

    if (filters.projectId) {
      params.push(filters.projectId);
      conditions.push(`project_id = $${params.length}`);
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }

    if (filters.priority) {
      params.push(filters.priority);
      conditions.push(`priority = $${params.length}`);
    }

    const sql = `
      SELECT 
        id, 
        project_id as "projectId", 
        user_id as "userId", 
        name, 
        description, 
        priority, 
        status, 
        due_date as "dueDate", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM tasks
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
    `;

    const result = await query<TaskResponse>(sql, params);
    return result.rows;
  }

  static async getTaskById(userId: string, taskId: string): Promise<TaskResponse> {
    const result = await query<TaskResponse>(
      `SELECT 
         id, 
         project_id as "projectId", 
         user_id as "userId", 
         name, 
         description, 
         priority, 
         status, 
         due_date as "dueDate", 
         created_at as "createdAt", 
         updated_at as "updatedAt"
       FROM tasks
       WHERE id = $1 AND user_id = $2`,
      [taskId, userId]
    );

    const task = result.rows[0];
    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  static async updateTask(
    userId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<TaskResponse> {
    // Verify task exists and belongs to user
    await this.getTaskById(userId, taskId);

    // If projectId is being updated, verify target project belongs to the user
    if (input.projectId !== undefined) {
      const projectCheck = await query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [input.projectId, userId]
      );
      if (projectCheck.rows.length === 0) {
        throw new AppError('Target project not found or access denied', 404);
      }
    }

    const updates: string[] = [];
    const params: any[] = [taskId, userId];

    if (input.projectId !== undefined) {
      params.push(input.projectId);
      updates.push(`project_id = $${params.length}`);
    }

    if (input.name !== undefined) {
      params.push(input.name);
      updates.push(`name = $${params.length}`);
    }

    if (input.description !== undefined) {
      params.push(input.description || null);
      updates.push(`description = $${params.length}`);
    }

    if (input.priority !== undefined) {
      params.push(input.priority);
      updates.push(`priority = $${params.length}`);
    }

    if (input.status !== undefined) {
      params.push(input.status);
      updates.push(`status = $${params.length}`);
    }

    if (input.dueDate !== undefined) {
      params.push(input.dueDate ? new Date(input.dueDate) : null);
      updates.push(`due_date = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.getTaskById(userId, taskId);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING 
        id, 
        project_id as "projectId", 
        user_id as "userId", 
        name, 
        description, 
        priority, 
        status, 
        due_date as "dueDate", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
    `;

    const result = await query<TaskResponse>(sql, params);
    return result.rows[0];
  }

  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const result = await query(
      `DELETE FROM tasks
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [taskId, userId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Task not found', 404);
    }
  }
}
