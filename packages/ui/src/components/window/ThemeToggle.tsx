"use client";

import { useTheme, type ThemeMode } from "../../context/ThemeContext";

const THEME_ICONS: Record<ThemeMode, string> = {
  dark: "\u25CF",   // ● filled circle
  light: "\u25CB",  // ○ empty circle
  system: "\u25D0", // ◐ half circle
};

const THEME_LABELS: Record<ThemeMode, string> = {
  dark: "dark",
  light: "light",
  system: "auto",
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer"
      aria-label={`Theme: ${THEME_LABELS[theme]}. Click to cycle.`}
      title={`Theme: ${THEME_LABELS[theme]}`}
    >
      <span>{THEME_ICONS[theme]}</span>
      <span>{THEME_LABELS[theme]}</span>
    </button>
  );
}
