import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
