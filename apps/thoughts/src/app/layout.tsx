import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import {
  PostHogProvider,
  ThemeProvider,
  WindowProvider,
  WindowContainer,
  WindowControls,
  WindowInner,
  WindowLayoutWrapper,
  TerminalHeaderTitle,
  TerminalStatusBar,
  TerminalPromptCentered,
  MinimizedPill,
  WavesBackground,
} from "@anipotts/ui";
import { ThemeScript } from "@anipotts/ui/server";
import { AdminProvider } from "@/context/AdminContext";
import AdminOverlay from "@/components/AdminOverlay";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "thoughts | ani potts",
  description: "Technical writings and reflections from ani potts",
  openGraph: {
    title: "thoughts | ani potts",
    description: "Technical writings and reflections from ani potts",
    url: "https://thoughts.anipotts.com",
    siteName: "thoughts.anipotts.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "thoughts | ani potts",
    description: "Technical writings and reflections from ani potts",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="relative min-h-screen antialiased text-foreground bg-transparent font-mono selection:bg-accent-400/20 selection:text-accent-400 overflow-x-hidden">

        <ThemeProvider>
        {/* Fixed Background Container */}
        <div className="fixed inset-0 -z-10 min-h-svh bg-background">
          {/* Ambient Background Effects */}
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "radial-gradient(circle at center, var(--ambient-from), var(--background), var(--background))" }} />
          <div className="absolute inset-0 z-10 bg-noise pointer-events-none mix-blend-overlay" style={{ opacity: "var(--noise-opacity)" }} />

          {/* Waves Animation */}
          <WavesBackground />
        </div>

        <PostHogProvider>
          <AdminProvider>
            <AdminOverlay />
            <WindowProvider>
            <WindowLayoutWrapper>

              {/* Dynamic Window Container */}
              <WindowContainer>

                {/* Terminal Header Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-input border-b border-border-subtle select-none">
                  <div className="flex items-center gap-2">
                    <WindowControls />
                    <TerminalHeaderTitle defaultTitle="ani@potts:~/thoughts.anipotts.com" />
                  </div>
                  <div className="text-[10px] md:text-xs text-faint font-mono">
                    zsh<span className="hidden md:inline"> • v3.0.1</span>
                  </div>
                </div>

                {/* Terminal Body */}
                <WindowInner showNavbar={false} showFooter={false}>
                  <nav className="flex items-center justify-between py-4 px-2 border-b border-border-subtle mb-8">
                    <a href="https://anipotts.com" className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors">
                      ani potts
                    </a>
                    <div className="flex items-center gap-4">
                      <a href="/" className="text-xs uppercase tracking-widest text-accent-400">
                        thoughts
                      </a>
                      <a href="/admin" className="text-xs uppercase tracking-widest text-muted hover:text-accent-400 transition-colors">
                        admin
                      </a>
                    </div>
                  </nav>
                  {children}
                </WindowInner>

                {/* Terminal Status Bar */}
                <TerminalStatusBar />
              </WindowContainer>

              {/* Collapsed/Minimized States */}
              <TerminalPromptCentered />
              <MinimizedPill />

            </WindowLayoutWrapper>
          </WindowProvider>
          </AdminProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
