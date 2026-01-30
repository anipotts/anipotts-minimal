import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
import AdminOverlay from "@/components/admin/AdminOverlay";
import PersonSchema from "@/components/PersonSchema";
import SubdomainNavigator from "@/components/SubdomainNavigator";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anipotts.com"),
  title: {
    default: "Ani Potts",
    template: "%s | Ani Potts",
  },
  description:
    "Ani Potts (Anirudh Pottammal) is a software engineer based in NYC who builds minimal interfaces to orchestrate complex systems",
  keywords: [
    "Ani Potts",
    "Anirudh Pottammal",
    "software engineer",
    "NYC",
    "developer",
    "NYU",
  ],
  authors: [{ name: "Ani Potts", url: "https://anipotts.com" }],
  creator: "Ani Potts",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://anipotts.com",
    siteName: "Ani Potts",
    title: "Ani Potts",
    description:
      "Software engineer based in NYC who builds minimal interfaces to orchestrate complex systems.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ani Potts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@anipottsbuilds",
    site: "@anipottsbuilds",
    title: "Ani Potts",
    description:
      "Software engineer based in NYC who builds minimal interfaces to orchestrate complex systems.",
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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ani Potts",
  },
  other: {
    "msapplication-TileColor": "#0a0a0a",
    "msapplication-config": "/browserconfig.xml",
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
        <PersonSchema />
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
            <WindowProvider>
              <WindowLayoutWrapper>
                {/* Dynamic Window Container */}
                <WindowContainer>
                  {/* Terminal Header Bar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-input border-b border-border-subtle select-none">
                    <div className="flex items-center gap-2">
                      <WindowControls />
                      <TerminalHeaderTitle />
                    </div>
                    <div className="text-[10px] md:text-xs text-faint font-mono">
                      zsh<span className="hidden md:inline"> • v3.0.1</span>
                    </div>
                  </div>

                  {/* Terminal Body with Navbar/Footer handling */}
                  <WindowInner>
                    <Navbar />
                    {children}
                    <Footer />
                  </WindowInner>

                  {/* Terminal Status Bar */}
                  <TerminalStatusBar />
                </WindowContainer>

                {/* Collapsed/Minimized States */}
                <TerminalPromptCentered />
                <MinimizedPill />
              </WindowLayoutWrapper>

              <AdminOverlay />
              <SubdomainNavigator />
            </WindowProvider>
          </AdminProvider>
        </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
