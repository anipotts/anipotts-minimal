import type { NextRequest } from "next/server";
import { generateIcon } from "@/lib/generateIcon";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const text = searchParams.get("text") || "ap";
  const scheme = searchParams.get("scheme") === "light" ? "light" : "dark";

  const response = generateIcon(text, scheme);
  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, immutable",
  );
  return response;
}
