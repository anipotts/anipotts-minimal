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
} from "@anipotts/ui";
import { ThemeScript, SubdomainHints, SpeculationRules } from "@anipotts/ui/server";
import { TerminalNavigator } from "@anipotts/ui/terminal-navigator";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "docs | ani potts",
  description: "Project documentation and guides",
  openGraph: { title: "docs | ani potts", description: "Documentation and guides", url: "https://docs.anipotts.com", siteName: "docs.anipotts.com", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head><ThemeScript /><SubdomainHints current="docs" /><SpeculationRules current="docs" /></head>
      <body className="relative min-h-screen antialiased text-foreground bg-transparent font-mono selection:bg-accent-400/20 selection:text-accent-400 overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider>
        <TerminalBackground />
        <PostHogProvider>
          <WindowProvider>
            <WindowLayoutWrapper>
              <WindowContainer>
                <TerminalHeader defaultTitle="ani@potts:~/docs.anipotts.com" />
                <WindowInner showNavbar={false} showFooter={false}>
                  <SubdomainHeader subdomain="docs" />
                  {children}
                </WindowInner>
                <TerminalStatusBar />
              </WindowContainer>
              <TerminalPromptCentered /><MinimizedPill />
            </WindowLayoutWrapper>
            <TerminalNavigator currentSubdomain="docs" />
          </WindowProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
