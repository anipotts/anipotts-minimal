import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { contactSchema, formatZodError } from "@anipotts/lib/validation";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const rate = await checkRateLimit(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: "error" in rate && rate.error ? rate.error : "Too many requests" },
        { status: "status" in rate && rate.status ? rate.status : 429 }
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatZodError(parsed.error), { status: 400 });
    }

    const { name, email, message, captchaToken } = parsed.data;

    const captchaRequired =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.TURNSTILE_SECRET_KEY);

    if (captchaRequired && !captchaToken) {
      return NextResponse.json({ error: "Captcha required" }, { status: 400 });
    }

    if (captchaToken) {
      const captcha = await verifyTurnstile(captchaToken);
      if (!captcha.success) {
        return NextResponse.json(
          { error: captcha.error || "Invalid captcha" },
          { status: captcha.status ?? 403 }
        );
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: ["contact@anipotts.com"],
      subject: `New Message from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    // Store submission in Supabase (non-blocking: email already sent)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("contact_submissions")
          .insert({ name, email, message, status: "new" });
      } catch (dbErr) {
        console.error("Failed to store contact submission:", dbErr);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Send API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
