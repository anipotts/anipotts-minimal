import { NextResponse } from "next/server";

export const ALLOWED_ORIGINS = new Set([
  "https://anipotts.com",
  "https://www.anipotts.com",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
]);

export function checkOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
