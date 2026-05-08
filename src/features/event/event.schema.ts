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

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  startDate: dateTimeOrDateString.optional(),
  endDate: dateTimeOrDateString.optional(),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: dateTimeOrDateString.optional(),
  endDate: dateTimeOrDateString.optional(),
}).partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
