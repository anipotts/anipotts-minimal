import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().max(320),
  message: z.string().trim().min(1).max(1000),
  captchaToken: z.string().optional(),
});

export const favoriteNumberSchema = z.object({
  number: z.number().finite(),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(200),
  totp: z.string().min(6).max(10),
});

export function formatZodError(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return { error: "Invalid input", fields };
}
