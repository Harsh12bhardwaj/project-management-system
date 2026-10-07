import { query } from '../config/database';

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
}

export class DashboardService {
  static async getStats(userId: string): Promise<DashboardStats> {
    const projectsPromise = query<{
      total_projects: string;
      projects_in_progress: string;
    }>(
      `SELECT 
         COUNT(*)::text as total_projects,
         COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END)::text as projects_in_progress
       FROM projects
       WHERE user_id = $1`,
      [userId]
    );

    const tasksPromise = query<{
      total_tasks: string;
      completed_tasks: string;
      pending_tasks: string;
    }>(
      `SELECT 
         COUNT(*)::text as total_tasks,
         COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::text as completed_tasks,
         COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::text as pending_tasks
       FROM tasks
       WHERE user_id = $1`,
      [userId]
    );

    const [projectsRes, tasksRes] = await Promise.all([projectsPromise, tasksPromise]);

    const pRow = projectsRes.rows[0] || { total_projects: '0', projects_in_progress: '0' };
    const tRow = tasksRes.rows[0] || { total_tasks: '0', completed_tasks: '0', pending_tasks: '0' };

    return {
      totalProjects: parseInt(pRow.total_projects, 10) || 0,
      totalTasks: parseInt(tRow.total_tasks, 10) || 0,
      completedTasks: parseInt(tRow.completed_tasks, 10) || 0,
      pendingTasks: parseInt(tRow.pending_tasks, 10) || 0,
      projectsInProgress: parseInt(pRow.projects_in_progress, 10) || 0,
    };
  }
}
