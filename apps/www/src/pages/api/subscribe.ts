import type { APIRoute } from "astro";
import { z } from "zod";
import { checkOrigin, checkRateLimit, json } from "../../lib/api";

export const prerender = false;

const emailSchema = z.string().trim().min(1).email().max(320);

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const forbidden = checkOrigin(request);
    if (forbidden) return forbidden;

    const env = locals.runtime.env;
    if (!env.BUTTONDOWN_API_KEY) {
      return json({ error: "Newsletter service not configured" }, 500);
    }

    const allowed = await checkRateLimit(request, env.DB);
    if (!allowed) return json({ error: "Too many requests" }, 429);

    const body = (await request.json()) as { email?: unknown };
    const parsed = emailSchema.safeParse(body.email);
    if (!parsed.success) {
      return json({ error: "Valid email required" }, 400);
    }

    const res = await fetch("https://api.buttondown.com/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${env.BUTTONDOWN_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email_address: parsed.data,
        tags: ["website"],
        type: "regular",
      }),
    });

    if (!res.ok) {
      console.error("buttondown error", res.status, await res.text());
      return json({ error: "Subscription failed" }, 502);
    }

    return json({ success: true });
  } catch (error) {
    console.error("subscribe api error", error);
    return json({ error: "Internal Server Error" }, 500);
  }
};
