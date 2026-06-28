import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(320),
  message: z.string().trim().min(1).max(1000),
  captchaToken: z.string().optional(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(200),
  totp: z
    .string()
    .regex(/^\d{6}$/, "TOTP must be exactly 6 digits")
    .or(z.literal("")),
});

export function formatZodError(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return { error: "Invalid input" as const, fields };
}

export type ContactPayload = z.infer<typeof contactSchema>;

type ParseContactResult =
  | { success: true; data: ContactPayload }
  | {
      success: false;
      error: { error: string; fields: Record<string, string> };
    };

export function parseContactPayload(input: unknown): ParseContactResult {
  const result = contactSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: formatZodError(result.error) };
  }
  return { success: true, data: result.data };
}
