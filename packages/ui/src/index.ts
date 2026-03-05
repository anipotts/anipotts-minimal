"use client";

// Window components
export { TerminalHeaderTitle, ThemeToggle } from "./components/window";
export type { TerminalHeaderTitleProps } from "./components/window";

// Animation components
export { FadeIn, Waves, WavesBackground } from "./components/animation";
export type { FadeInProps, WavesProps } from "./components/animation";

// Feedback components
export { StatusDot } from "./components/feedback";
export type { StatusDotProps } from "./components/feedback";

// Layout components
export { TerminalBackground, TerminalHeader } from "./components/layout";
export type { TerminalHeaderProps } from "./components/layout";

// Context
export { ThemeProvider, useTheme } from "./context";
export type { ThemeMode, ResolvedTheme } from "./context";

// Hooks
export { getSectionFromPath, getSectionPath, getInternalPath } from "./hooks";

// Providers
export { PostHogProvider } from "./providers";
export type { PostHogProviderProps } from "./providers";

// Navigation
export { ExpandableNav } from "./components/navigation";
export type { ExpandableNavProps } from "./components/navigation";

// Utils
export {
  prefetchUrl,
  createHoverPrefetch,
  isPrefetched,
  clearPrefetchCache,
  navigateToSection,
  navigateSameOrigin,
  supportsViewTransitions,
} from "./utils";
