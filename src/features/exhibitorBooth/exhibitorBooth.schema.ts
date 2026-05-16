import { z } from 'zod';

export const createExhibitorBoothSchema = z.object({
  boothName: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

export const updateExhibitorBoothSchema = createExhibitorBoothSchema.partial();

export const createBoothWithDocumentsSchema = z.object({
  boothName: z.string().min(1, 'Booth name required').max(200),
  description: z.string().min(1, 'Description required').max(5000),
  documents: z
    .array(
      z.object({
        rawText: z.string().min(1, 'rawText required'),
        fileType: z.enum(['card', 'brochure']),
        fileName: z.string().min(1, 'fileName required'),
        driveFileId: z.string().min(1).optional(),
        driveFileUrl: z.string().url().optional(),
        mimeType: z.string().optional(),
        sizeBytes: z.number().positive().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .min(1, 'At least one document is required'),
});

export type CreateExhibitorBoothInput = z.infer<typeof createExhibitorBoothSchema>;
export type UpdateExhibitorBoothInput = z.infer<typeof updateExhibitorBoothSchema>;
export type CreateBoothWithDocumentsInput = z.infer<typeof createBoothWithDocumentsSchema>;
