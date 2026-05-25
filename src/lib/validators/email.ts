import { z } from "zod";

export const emailOnlySchema = z.object({
  email: z.string().email(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1).max(128),
});
