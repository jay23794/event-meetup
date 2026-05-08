import { z } from 'zod';

export const createExhibitorBoothSchema = z.object({
  boothName: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

export const updateExhibitorBoothSchema = createExhibitorBoothSchema.partial();

export type CreateExhibitorBoothInput = z.infer<typeof createExhibitorBoothSchema>;
export type UpdateExhibitorBoothInput = z.infer<typeof updateExhibitorBoothSchema>;
