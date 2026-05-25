import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
