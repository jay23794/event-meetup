import { z } from 'zod';

const dateTimeOrDateString = z.string().refine(
  (val) => {
    try {
      new Date(val);
      return true;
    } catch {
      return false;
    }
  },
  'Invalid date format. Use ISO 8601 datetime or date string (YYYY-MM-DD)'
);

export const createExhibitorBoothSchema = z.object({
  boothName: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

export const updateExhibitorBoothSchema = createExhibitorBoothSchema.partial();

const documentSchema = z.object({
  rawText: z.string().min(1, 'rawText required'),
  fileType: z.enum(['card', 'brochure']),
  fileName: z.string().min(1, 'fileName required'),
  driveFileId: z.string().min(1).optional(),
  driveFileUrl: z.string().url().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().positive().optional(),
  isPublic: z.boolean().optional(),
});

export const createBoothWithDocumentsSchema = z.object({
  boothName: z.string().min(1, 'Booth name required').max(200),
  description: z.string().min(1, 'Description required').max(5000),
  documents: z.array(documentSchema).min(1, 'At least one document is required'),
});

export const createEventWithBoothAndDocumentsSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  startDate: dateTimeOrDateString.optional(),
  endDate: dateTimeOrDateString.optional(),
  boothName: z.string().min(1, 'Booth name required').max(200),
  description: z.string().min(1, 'Description required').max(5000),
  documents: z.array(documentSchema).min(1, 'At least one document is required'),
});

export type CreateExhibitorBoothInput = z.infer<typeof createExhibitorBoothSchema>;
export type UpdateExhibitorBoothInput = z.infer<typeof updateExhibitorBoothSchema>;
export type CreateBoothWithDocumentsInput = z.infer<typeof createBoothWithDocumentsSchema>;
export type CreateEventWithBoothAndDocumentsInput = z.infer<
  typeof createEventWithBoothAndDocumentsSchema
>;
