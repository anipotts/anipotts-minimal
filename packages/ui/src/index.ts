// Window components
export {
  WindowContainer,
  WindowControls,
  WindowLayoutWrapper,
  TerminalPromptCentered,
  MinimizedPill,
  WindowInner,
  TerminalHeaderTitle,
  TerminalStatusBar,
} from "./components/window";
export type {
  WindowContainerProps,
  WindowLayoutWrapperProps,
  TerminalPromptCenteredProps,
  MinimizedPillProps,
  WindowInnerProps,
  TerminalHeaderTitleProps,
} from "./components/window";

// Animation components
export { FadeIn, Waves } from "./components/animation";
export type { FadeInProps, WavesProps } from "./components/animation";

// Feedback components
export { StatusDot } from "./components/feedback";
export type { StatusDotProps } from "./components/feedback";

// Context
export { WindowProvider, useWindowState } from "./context";
export type { WindowState } from "./context";

// Hooks
export { useDebounce } from "./hooks";

// Providers
export { PostHogProvider } from "./providers";
export type { PostHogProviderProps } from "./providers";

// Admin
export { AdminProvider, useAdmin, AdminShell, AdminLogin } from "./admin";
export type { AdminActions, AdminContextType } from "./admin";
