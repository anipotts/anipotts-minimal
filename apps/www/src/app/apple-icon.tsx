import { generateAppleIcon } from "@/lib/generateAppleIcon";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  return generateAppleIcon("ap");
}
