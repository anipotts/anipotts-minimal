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

    const apiKey = process.env.BEEHIIV_API_KEY;
    const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

    if (!apiKey || !publicationId) {
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

    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: parsed.data,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: "anipotts.com",
          referring_site: "https://anipotts.com",
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      logger.error("subscribe", `Beehiiv API returned ${res.status}`, {
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
