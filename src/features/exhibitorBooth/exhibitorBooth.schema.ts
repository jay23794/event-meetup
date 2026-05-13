import { z } from 'zod';

export const createExhibitorBoothSchema = z.object({
  boothName: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

export const updateExhibitorBoothSchema = createExhibitorBoothSchema.partial();

export const createBoothWithDocumentsSchema = z.object({
  boothName: z.string().min(1, 'Booth name required').max(200),
  description: z.string().min(1, 'Description required').max(5000),
});

export type CreateExhibitorBoothInput = z.infer<typeof createExhibitorBoothSchema>;
export type UpdateExhibitorBoothInput = z.infer<typeof updateExhibitorBoothSchema>;
export type CreateBoothWithDocumentsInput = z.infer<typeof createBoothWithDocumentsSchema>;
