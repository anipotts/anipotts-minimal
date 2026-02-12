interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        error: "Turnstile secret not configured",
        status: 500,
      };
    }
    console.warn("[turnstile] Secret missing; skipping verification");
    return { success: true };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  const data = (await res.json()) as TurnstileResponse;
  if (!data.success) {
    return {
      success: false,
      error: data["error-codes"]?.join(",") || "Invalid captcha",
      status: 403,
    };
  }
  return { success: true };
}
