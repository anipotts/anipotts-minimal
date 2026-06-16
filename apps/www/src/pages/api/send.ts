import type { APIRoute } from "astro";
import { z } from "zod";
import {
  checkOrigin,
  checkRateLimit,
  json,
  verifyTurnstile,
} from "../../lib/api";

export const prerender = false;

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(10).max(1000),
  captchaToken: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const env = locals.runtime.env;
    if (!env.RESEND_API_KEY) {
      return json({ error: "Email service not configured" }, 500);
    }

    const allowed = await checkRateLimit(request, env.DB);
    if (!allowed) return json({ error: "Too many requests" }, 429);

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ error: "Invalid payload" }, 400);
    }
    const { name, email, message, captchaToken } = parsed.data;

    // captcha is optional by design: enforced only when the secret is set
    if (env.TURNSTILE_SECRET_KEY) {
      if (!captchaToken) return json({ error: "Captcha required" }, 400);
      const ok = await verifyTurnstile(
        captchaToken,
        env.TURNSTILE_SECRET_KEY,
        request.headers.get("cf-connecting-ip") ?? "",
      );
      if (!ok) return json({ error: "Invalid captcha" }, 403);
    }

    // verified sender: contact@anipotts.com (anipotts.com is a verified
    // resend domain). the old onboarding@resend.dev sender is gone.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: "Contact Form <contact@anipotts.com>",
        to: ["contact@anipotts.com"],
        subject: `New Message from ${name}`,
        reply_to: email,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      }),
    });

    if (!res.ok) {
      console.error("resend error", res.status, await res.text());
      return json({ error: "Failed to send email" }, 502);
    }

    return json({ success: true });
  } catch (error) {
    console.error("send api error", error);
    return json({ error: "Internal Server Error" }, 500);
  }
};
