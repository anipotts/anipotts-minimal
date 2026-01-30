import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider, ThemeProvider, WindowProvider, WindowContainer, WindowControls, WindowInner, WindowLayoutWrapper, TerminalHeaderTitle, TerminalStatusBar, TerminalPromptCentered, MinimizedPill, WavesBackground } from "@anipotts/ui";
import { ThemeScript } from "@anipotts/ui/server";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "updates | ani potts",
  description: "Changelog and development velocity",
  openGraph: { title: "updates | ani potts", description: "Changelog and updates", url: "https://updates.anipotts.com", siteName: "updates.anipotts.com", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body className="relative min-h-screen antialiased text-foreground bg-transparent font-mono selection:bg-accent-400/20 selection:text-accent-400 overflow-x-hidden">
        <ThemeProvider>
        <div className="fixed inset-0 -z-10 min-h-svh bg-background">
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(circle at center, var(--ambient-from), var(--background), var(--background))" }} />
          <div className="absolute inset-0 z-10 bg-noise pointer-events-none mix-blend-overlay" style={{ opacity: "var(--noise-opacity)" }} />
          <WavesBackground />
        </div>
        <PostHogProvider>
          <WindowProvider>
            <WindowLayoutWrapper>
              <WindowContainer>
                <div className="flex items-center justify-between px-4 py-2 bg-input border-b border-border-subtle select-none">
                  <div className="flex items-center gap-2"><WindowControls /><TerminalHeaderTitle defaultTitle="ani@potts:~/updates.anipotts.com" /></div>
                  <div className="text-[10px] md:text-xs text-faint font-mono">zsh<span className="hidden md:inline"> • v3.0.1</span></div>
                </div>
                <WindowInner showNavbar={false} showFooter={false}>{children}</WindowInner>
                <TerminalStatusBar />
              </WindowContainer>
              <TerminalPromptCentered /><MinimizedPill />
            </WindowLayoutWrapper>
          </WindowProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
