"use client";

import { useTheme } from "../../context/ThemeContext";
import { Waves } from "./Waves";

export function WavesBackground() {
  const { resolvedTheme } = useTheme();

  const lineColor =
    resolvedTheme === "dark"
      ? "rgba(97, 171, 234, 0.96)"
      : "rgba(255, 255, 255, 0.8)";

  return (
    <div
      className="hidden md:block absolute inset-0 z-20 pointer-events-none"
      style={{ opacity: "var(--waves-opacity)" }}
    >
      <Waves
        lineColor={lineColor}
        backgroundColor="transparent"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />
    </div>
  );
}
