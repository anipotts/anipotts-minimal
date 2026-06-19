import { cookies, headers } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  createSessionToken,
  verifyAdminPassword,
  verifyAdminTotp,
} from "@anipotts/lib/admin";
import { getEnv } from "@anipotts/lib/env";
import { adminLoginSchema, formatZodError } from "@anipotts/lib/validation";
import { checkAdminLoginRateLimit } from "@/lib/rateLimit";

function loginIp(headersList: Headers) {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

export async function loginAdmin(formData: FormData) {
  const hdrs = await headers();
  const rateLimit = await checkAdminLoginRateLimit(loginIp(hdrs));
  if (!rateLimit.success) {
    return { error: "Too many login attempts. Try again later." };
  }

  const raw = {
    password: formData.get("password") as string,
    totp: (formData.get("totp") as string) || "",
  };

  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) {
    return formatZodError(parsed.error);
  }

  const { password, totp } = parsed.data;

  const pwResult = verifyAdminPassword(password, getEnv("ADMIN_PASSWORD"));
  if (!pwResult.success) {
    return { error: pwResult.error || "Invalid password" };
  }

  const totpSecret = getEnv("ADMIN_TOTP_SECRET");
  if (totpSecret) {
    if (!totp) {
      return { error: "TOTP code is required" };
    }
    const totpResult = verifyAdminTotp(totp, totpSecret);
    if (!totpResult.success) {
      return { error: totpResult.error || "Invalid TOTP" };
    }
  }

  const secret = getEnv("ADMIN_PASSWORD") ?? "";
  const token = createSessionToken(secret);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    ...ADMIN_COOKIE_OPTIONS,
    sameSite: ADMIN_COOKIE_OPTIONS.sameSite as "strict" | "lax" | "none",
  });

  return { success: true };
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return { success: true };
}
