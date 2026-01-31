import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import {
  PostHogProvider,
  ThemeProvider,
  WindowProvider,
  WindowContainer,
  WindowInner,
  WindowLayoutWrapper,
  TerminalStatusBar,
  TerminalPromptCentered,
  MinimizedPill,
  TerminalBackground,
  TerminalHeader,
} from "@anipotts/ui";
import { ThemeScript } from "@anipotts/ui/server";
import { AdminProvider } from "@/context/AdminContext";
import AdminOverlay from "@/components/AdminOverlay";
import { TerminalNavigator } from "@anipotts/ui/terminal-navigator";

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
        <TerminalBackground />

        <PostHogProvider>
          <AdminProvider>
            <AdminOverlay />
            <WindowProvider>
            <WindowLayoutWrapper>

              <WindowContainer>
                <TerminalHeader defaultTitle="ani@potts:~/thoughts.anipotts.com" />

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

                <TerminalStatusBar />
              </WindowContainer>

              <TerminalPromptCentered />
              <MinimizedPill />

            </WindowLayoutWrapper>
            <TerminalNavigator currentSubdomain="thoughts" />
          </WindowProvider>
          </AdminProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
