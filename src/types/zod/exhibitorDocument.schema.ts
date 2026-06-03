import { z } from 'zod';

export const listExhibitorDocumentsQuerySchema = z.object({
  fileType: z.enum(['card', 'brochure']).optional(),
});

export type ListExhibitorDocumentsQuery = z.infer<typeof listExhibitorDocumentsQuerySchema>;
