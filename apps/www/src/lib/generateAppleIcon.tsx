import { ImageResponse } from "next/og";

/**
 * Generates a 180x180 Apple touch icon with 2-letter text.
 * Dark mode: blue (#61abea) on black (#0a0a0a)
 * Light mode: purple (#a78bfa) on white (#faf9f7)
 */
export function generateAppleIcon(
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
        }}
      >
        <span
          style={{
            fontSize: 80,
            fontWeight: 400,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.02em",
            color: fg,
          }}
        >
          {text}
        </span>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
