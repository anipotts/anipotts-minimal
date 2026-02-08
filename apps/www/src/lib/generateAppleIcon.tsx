import { ImageResponse } from "next/og";

/**
 * Generates a 180x180 Apple touch icon with 2-letter text on dark background.
 * Uses lavender (#a78bfa) for all icons.
 */
export function generateAppleIcon(text: string) {
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
        }}
      >
        <span
          style={{
            fontSize: 80,
            fontWeight: 400,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.02em",
            color: "#a78bfa",
          }}
        >
          {text}
        </span>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
