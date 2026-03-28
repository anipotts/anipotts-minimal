import { NextResponse } from "next/server";
import { Resend } from "resend";
import { checkOrigin } from "@/lib/cors";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";
import { parseContactPayload } from "@anipotts/lib";

export async function POST(request: Request) {
  try {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const rate = await checkRateLimit(request);
    if (!rate.success) {
      return NextResponse.json(
        {
          error:
            "error" in rate && rate.error ? rate.error : "Too many requests",
        },
        { status: "status" in rate && rate.status ? rate.status : 429 },
      );
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

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error: sendError } = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: ["contact@anipotts.com"],
      subject: `New Message from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
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
