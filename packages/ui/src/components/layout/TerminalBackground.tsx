"use client";

import { WavesBackground } from "../animation";

export function TerminalBackground() {
  return (
    <div className="fixed inset-0 -z-10 min-h-svh bg-background">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, var(--ambient-from), var(--background), var(--background))",
        }}
      />
      <div
        className="absolute inset-0 z-10 bg-noise pointer-events-none mix-blend-overlay"
        style={{ opacity: "var(--noise-opacity)" }}
      />
      <WavesBackground />
    </div>
  );
}
