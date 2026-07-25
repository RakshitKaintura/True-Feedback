import { z } from 'zod';

export const projectSchema = z.object({
  title: z
    .string()
    .min(2, { message: 'Title must be at least 2 characters.' })
    .max(50, { message: 'Title must not exceed 50 characters.' }),
});
