import { z } from "zod";

const clientTypeSchema = z.enum(["public", "confidential"]);

export const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  redirectUrls: z.array(z.string().url()).min(1).max(20),
  clientType: clientTypeSchema.optional().default("public"),
});

export const updateAppSchema = z
  .object({
    redirectUrls: z.array(z.string().url()).min(1).max(20).optional(),
    clientType: clientTypeSchema.optional(),
  })
  .refine((d) => d.redirectUrls !== undefined || d.clientType !== undefined, {
    message: "Provide redirectUrls and/or clientType",
  });
