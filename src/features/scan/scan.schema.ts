import { z } from 'zod';

export const scanBodySchema = z.object({
  eventId: z.string().min(24).max(24, 'Invalid MongoDB ObjectId'),
});

export type ScanBody = z.infer<typeof scanBodySchema>;
