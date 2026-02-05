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
  SubdomainHeader,
  SubdomainFooter,
} from "@anipotts/ui";
import { ThemeScript } from "@anipotts/ui/server";
import { TerminalNavigator } from "@anipotts/ui/terminal-navigator";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "status | ani potts",
  description: "Service uptime and health checks",
  openGraph: { title: "status | ani potts", description: "Service uptime monitoring", url: "https://status.anipotts.com", siteName: "status.anipotts.com", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body className="relative min-h-screen antialiased text-foreground bg-transparent font-mono selection:bg-accent-400/20 selection:text-accent-400 overflow-x-hidden">
        <ThemeProvider>
        <TerminalBackground />
        <PostHogProvider>
          <WindowProvider>
            <WindowLayoutWrapper>
              <WindowContainer>
                <TerminalHeader defaultTitle="ani@potts:~/status.anipotts.com" />
                <WindowInner showNavbar={false} showFooter={false}>
                  <SubdomainHeader subdomain="status" />
                  {children}
                  <SubdomainFooter subdomain="status" />
                </WindowInner>
                <TerminalStatusBar />
              </WindowContainer>
              <TerminalPromptCentered /><MinimizedPill />
            </WindowLayoutWrapper>
            <TerminalNavigator currentSubdomain="status" />
          </WindowProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
