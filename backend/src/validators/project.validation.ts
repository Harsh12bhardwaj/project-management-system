import { z } from 'zod';

export const projectStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);

export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(255, 'Project name cannot exceed 255 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    status: projectStatusEnum.optional().default('NOT_STARTED'),
    startDate: z
      .string()
      .datetime({ message: 'Invalid start date format (ISO 8601 expected)' })
      .optional()
      .nullable(),
    endDate: z
      .string()
      .datetime({ message: 'Invalid end date format (ISO 8601 expected)' })
      .optional()
      .nullable(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid project ID format' }),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(255, 'Project name cannot exceed 255 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    status: projectStatusEnum.optional(),
    startDate: z
      .string()
      .datetime({ message: 'Invalid start date format (ISO 8601 expected)' })
      .optional()
      .nullable(),
    endDate: z
      .string()
      .datetime({ message: 'Invalid end date format (ISO 8601 expected)' })
      .optional()
      .nullable(),
  }),
});

export const getProjectByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Invalid project ID format' }),
  }),
});

export const listProjectsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    status: projectStatusEnum.optional(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
export type ListProjectsQuery = z.infer<typeof listProjectsSchema>['query'];
