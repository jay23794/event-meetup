import { z } from 'zod';

export const createExhibitorDocumentSchema = z.object({
  driveFileId: z.string().min(1, 'Drive file ID is required'),
  driveFileUrl: z.string().url('Invalid Drive file URL'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.enum(['card', 'brochure']),
  mimeType: z.string().optional(),
  sizeBytes: z.number().positive().optional(),
  isPublic: z.boolean().optional().default(false),
});

export const extractDocumentSchema = z.object({
  rawText: z.string().min(1, 'Raw text is required'),
});

export const listExhibitorDocumentsQuerySchema = z.object({
  fileType: z.enum(['card', 'brochure']).optional(),
});

export type CreateExhibitorDocumentInput = z.infer<typeof createExhibitorDocumentSchema>;
export type ExtractDocumentInput = z.infer<typeof extractDocumentSchema>;
export type ListExhibitorDocumentsQuery = z.infer<typeof listExhibitorDocumentsQuerySchema>;
