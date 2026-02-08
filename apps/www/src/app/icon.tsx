import { generateIcon } from "@/lib/generateIcon";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 32, height: 32 };

export default function Icon() {
  return generateIcon("ap");
}
