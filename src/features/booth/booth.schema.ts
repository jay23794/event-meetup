import { z } from 'zod';

const extractedFieldsSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
});

const scanSchema = z.object({
  ocrText: z.string(),
  extractedFields: extractedFieldsSchema,
  imageUrl: z.string().url().optional(),
  driveFileId: z.string().optional(),
});

const voiceNoteSchema = z.object({
  transcript: z.string(),
  durationSec: z.number().positive(),
});

export const createBoothSchema = z
  .object({
    boothName: z.string().optional(),
    scans: z.array(scanSchema).optional().default([]),
    voiceNote: voiceNoteSchema.optional(),
  })
  .refine(
    (data) => data.scans.length > 0 || data.voiceNote,
    'At least one of scans or voiceNote must be provided'
  );

export const updateBoothSchema = z.object({
  boothName: z.string().optional(),
}).partial();

export const listBoothsQuerySchema = z.object({
  limit: z.number().min(1).max(200).optional(),
  cursor: z.number().optional(),
});

export type CreateBoothInput = z.infer<typeof createBoothSchema>;
export type UpdateBoothInput = z.infer<typeof updateBoothSchema>;
export type ListBoothsQuery = z.infer<typeof listBoothsQuerySchema>;
