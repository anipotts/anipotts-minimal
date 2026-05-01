import { NextResponse } from "next/server";
import { checkOrigin } from "@/lib/cors";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";
import { parseContactPayload } from "@anipotts/lib";
import { sendViaBinding, type SendEmailBinding } from "@anipotts/lib/email";

function getSendEmailBinding(): SendEmailBinding | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    return ctx?.env?.SEND_EMAIL as SendEmailBinding | undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  try {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const rate = await checkRateLimit(request);
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = parseContactPayload(body);
    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const data = parsed.data;
    if (!data) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { name, email, message, captchaToken } = data;

    const captchaRequired = Boolean(process.env.TURNSTILE_SECRET_KEY);

    if (captchaRequired && !captchaToken) {
      return NextResponse.json({ error: "Captcha required" }, { status: 400 });
    }

    if (captchaToken) {
      const captcha = await verifyTurnstile(captchaToken);
      if (!captcha.success) {
        return NextResponse.json(
          { error: captcha.error || "Invalid captcha" },
          { status: captcha.status ?? 403 },
        );
      }
    }

    const binding = getSendEmailBinding();

    if (!binding) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          JSON.stringify({
            event: "email.send.dev",
            note: "no SEND_EMAIL binding; would send",
            from: name,
            email,
          }),
        );
        return NextResponse.json({ success: true, dev: true });
      }
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const result = await sendViaBinding(
      binding,
      {
        from: "Contact Form <noreply@anipotts.com>",
        to: "contact@anipotts.com",
        replyTo: email,
        subject: `New Message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      },
      { maxAttempts: 1 },
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
