import { NextResponse } from "next/server";
import { z } from "zod";
import { checkOrigin } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rateLimit";
import { logger } from "@anipotts/lib";

const emailSchema = z.string().trim().min(1).email().max(320);

export async function POST(request: Request) {
  try {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const rate = await checkRateLimit(request);
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const apiKey = process.env.BUTTONDOWN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Newsletter service not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const parsed = emailSchema.safeParse(body.email);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    const res = await fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: parsed.data,
        tags: ["website"],
        type: "regular",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error("subscribe", `Buttondown API returned ${res.status}`, {
        body: err,
      });
      return NextResponse.json(
        { error: "Subscription failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "subscribe",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
