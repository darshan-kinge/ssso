import { z } from "zod";

export const tokenRequestSchema = z
  .object({
    grant_type: z.literal("authorization_code"),
    code: z.string().min(1),
    client_id: z.string().min(1),
    client_secret: z.string().min(1).optional(),
    code_verifier: z.string().min(1).optional(),
    redirect_uri: z.string().url(),
  })
  .refine((d) => d.client_secret || d.code_verifier, {
    message: "client_secret or code_verifier is required",
  });

export type TokenRequestInput = z.infer<typeof tokenRequestSchema>;
