import { ImageResponse } from "next/og";

/**
 * Generates a 32x32 favicon with 2-letter text.
 * Dark mode: blue (#61abea) on black (#0a0a0a)
 * Light mode: purple (#a78bfa) on white (#faf9f7)
 */
export function generateIcon(
  text: string,
  scheme: "dark" | "light" = "dark"
) {
  const bg = scheme === "dark" ? "#0a0a0a" : "#faf9f7";
  const fg = scheme === "dark" ? "#61abea" : "#a78bfa";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
          borderRadius: 4,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "monospace",
            color: fg,
          }}
        >
          {text}
        </span>
      </div>
    ),
    { width: 32, height: 32 }
  );
}
