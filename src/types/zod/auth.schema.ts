import z from "zod";

export const AuthQuerySchema = z.object({
  origin: z.string().optional(),
  returnUrl: z.string().optional(),
});

export const CallbackQuerySchema  = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
});

