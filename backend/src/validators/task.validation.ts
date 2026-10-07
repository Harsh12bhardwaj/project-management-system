import { z } from 'zod';

export const taskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }).uuid({ message: 'Invalid project ID format' }),
    name: z
      .string({ required_error: 'Task name is required' })
      .trim()
      .min(1, 'Task name cannot be empty')
      .max(255, 'Task name cannot exceed 255 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    priority: taskPriorityEnum.optional().default('MEDIUM'),
    status: taskStatusEnum.optional().default('PENDING'),
    dueDate: z
      .string()
      .datetime({ message: 'Invalid due date format (ISO 8601 expected)' })
      .optional()
      .nullable(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid task ID format' }),
  }),
  body: z.object({
    projectId: z.string().uuid({ message: 'Invalid project ID format' }).optional(),
    name: z
      .string()
      .trim()
      .min(1, 'Task name cannot be empty')
      .max(255, 'Task name cannot exceed 255 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    priority: taskPriorityEnum.optional(),
    status: taskStatusEnum.optional(),
    dueDate: z
      .string()
      .datetime({ message: 'Invalid due date format (ISO 8601 expected)' })
      .optional()
      .nullable(),
  }),
});

export const getTaskByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid task ID format' }),
  }),
});

export const listTasksSchema = z.object({
  query: z.object({
    projectId: z.string().uuid({ message: 'Invalid project ID format' }).optional(),
    search: z.string().trim().optional(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
export type ListTasksQuery = z.infer<typeof listTasksSchema>['query'];
