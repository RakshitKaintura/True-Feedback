import { z } from 'zod';

export const customPromptSchema = z.object({
  prompt: z
    .string()
    .max(200, { message: 'Prompt must not exceed 200 characters.' }),
});
