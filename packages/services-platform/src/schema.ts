import { z } from "zod";

export const visibilitySchema = z.enum(["internal", "public"]);

export const miniSpecSchema = z.object({
  port: z.number().int().min(1).max(65535),
  workingDir: z.string().min(1),
  command: z.array(z.string()).min(1),
  healthPath: z.string().startsWith("/").optional(),
  env: z.record(z.string(), z.string()).optional(),
  preserveExistingPlist: z.boolean().optional(),
});

export const accessSpecSchema = z.object({
  emails: z.array(z.string().email()).optional(),
  serviceTokenIds: z.array(z.string()).optional(),
});

export const serviceManifestSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, "lowercase kebab-case only"),
  hostname: z.string().min(1),
  visibility: visibilitySchema,
  mini: miniSpecSchema,
  access: accessSpecSchema.optional(),
  owner: z.string().min(1),
  description: z.string().optional(),
});

export type ValidatedManifest = z.infer<typeof serviceManifestSchema>;
