import { ImageResponse } from "next/og";

/**
 * Generates a 32x32 favicon with 2-letter text on dark background.
 * Uses lavender (#a78bfa) for all icons.
 */
export function generateIcon(text: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 4,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "monospace",
            color: "#a78bfa",
          }}
        >
          {text}
        </span>
      </div>
    ),
    { width: 32, height: 32 }
  );
}
