import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";
import { parseContactPayload } from "@/lib/contactValidation";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && !origin.endsWith("anipotts.com") && origin !== "http://localhost:3000") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const { name, email, message, captchaToken } = parsed.data;

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

    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: ["contact@anipotts.com"],
      subject: `New Message from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
