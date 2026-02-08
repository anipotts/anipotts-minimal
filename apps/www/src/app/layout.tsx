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
} from "@anipotts/ui";
import { ThemeScript } from "@anipotts/ui/server";
import { AdminProvider } from "@/context/AdminContext";
import AdminOverlay from "@/components/admin/AdminOverlay";
import PersonSchema from "@/components/PersonSchema";
import TerminalNavigatorWrapper from "@/components/TerminalNavigatorWrapper";
import TerminalHeaderWrapper from "@/components/TerminalHeaderWrapper";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anipotts.com"),
  title: {
    default: "ani potts",
    template: "%s | ani potts",
  },
  description:
    "software engineer in nyc building minimal interfaces to orchestrate complex systems",
  keywords: [
    "ani potts",
    "anirudh pottammal",
    "software engineer",
    "nyc",
    "developer",
    "nyu",
  ],
  authors: [{ name: "ani potts", url: "https://anipotts.com" }],
  creator: "ani potts",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://anipotts.com",
    siteName: "ani potts",
    title: "ani potts",
    description:
      "software engineer in nyc building minimal interfaces to orchestrate complex systems",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ani potts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@anipottsbuilds",
    site: "@anipottsbuilds",
    title: "ani potts",
    description:
      "software engineer in nyc building minimal interfaces to orchestrate complex systems",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://anipotts.com",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ani potts",
  },
  other: {
    "msapplication-TileColor": "#0a0a0a",
    "msapplication-config": "/browserconfig.xml",
  },
};

/**
 * Root layout for the consolidated single-app architecture.
 *
 * This layout provides:
 * - Theme system (ThemeProvider, ThemeScript)
 * - Terminal UI chrome (TerminalBackground, WindowContainer, etc.)
 * - Admin system (AdminProvider, AdminOverlay)
 * - Analytics (PostHogProvider)
 * - Navigation (TerminalNavigator)
 *
 * Child layouts ((main) and (subdomain)) add their specific
 * components like Navbar/Footer or SubdomainHeader.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <PersonSchema />
      </head>
      <body className="relative min-h-screen antialiased text-foreground bg-transparent font-mono selection:bg-accent-400/20 selection:text-accent-400 overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider>
          <TerminalBackground />

          <PostHogProvider>
            <AdminProvider>
              <WindowProvider>
                <WindowLayoutWrapper>
                  <WindowContainer>
                    <TerminalHeaderWrapper />

                    <WindowInner showNavbar={false} showFooter={false}>
                      {children}
                    </WindowInner>

                    <TerminalStatusBar />
                  </WindowContainer>

                  <TerminalPromptCentered />
                  <MinimizedPill />
                </WindowLayoutWrapper>

                <AdminOverlay />
                <TerminalNavigatorWrapper />
              </WindowProvider>
            </AdminProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
