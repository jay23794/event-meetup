import { z } from 'zod';

export const createBoothDocumentSchema = z.object({
  driveFileId: z.string().min(1, 'Drive file ID is required'),
  driveFileUrl: z.string().url('Invalid Drive file URL'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(['card', 'brochure']),
  mimeType: z.string().optional(),
  sizeBytes: z.number().positive().optional(),
  isPublic: z.boolean().optional().default(false),
  extractedText: z.string().optional(),
});

export const listBoothDocumentsQuerySchema = z.object({
  fileType: z.enum(['card', 'brochure']).optional(),
});

export type CreateBoothDocumentInput = z.infer<typeof createBoothDocumentSchema>;
export type ListBoothDocumentsQuery = z.infer<typeof listBoothDocumentsQuerySchema>;
