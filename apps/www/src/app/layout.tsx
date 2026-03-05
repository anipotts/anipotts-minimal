import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import {
  PostHogProvider,
  ThemeProvider,
  TerminalBackground,
} from "@anipotts/ui";
import { ThemeScript } from "@anipotts/ui/server";
import PersonSchema from "@/components/PersonSchema";
import SiteStatusBar from "@/components/SiteStatusBar";
import TerminalHeaderWrapper from "@/components/TerminalHeaderWrapper";
import { siteConfig } from "@/content/site";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name.toLowerCase(),
    template: `%s | ${siteConfig.name.toLowerCase()}`,
  },
  description: `${siteConfig.title.toLowerCase()} in ${siteConfig.location.toLowerCase()} building minimal interfaces to orchestrate complex systems`,
  keywords: [
    "ani potts",
    "anirudh pottammal",
    "software engineer",
    "structured ai",
    "yc f25",
    "autonomous agents",
    "nyc",
    "developer",
    "claude code",
  ],
  authors: [{ name: siteConfig.name.toLowerCase(), url: siteConfig.url }],
  creator: siteConfig.name.toLowerCase(),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name.toLowerCase(),
    title: siteConfig.name.toLowerCase(),
    description: siteConfig.bio,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name.toLowerCase(),
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.handle,
    site: siteConfig.handle,
    title: siteConfig.name.toLowerCase(),
    description: siteConfig.bio,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteConfig.url,
    types: {
      "application/rss+xml": `${siteConfig.url}/feed.xml`,
    },
  },
  icons: {
    icon: [
      {
        url: "/api/icon?text=ap&scheme=dark",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/api/icon?text=ap&scheme=light",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: light)",
      },
    ],
    apple: [
      {
        url: "/api/icon?text=ap&scheme=dark",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <PersonSchema />
        <meta
          name="theme-color"
          content="#61abea"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#020308"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body
        className="relative min-h-screen antialiased text-foreground bg-transparent font-mono selection:bg-accent-400/20 selection:text-accent-400 overflow-x-hidden"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[99999] focus:bg-accent-400 focus:text-black focus:px-4 focus:py-2 focus:rounded-sm focus:text-xs focus:font-mono focus:uppercase focus:tracking-widest"
        >
          Skip to content
        </a>

        <ThemeProvider>
          <TerminalBackground />

          <PostHogProvider>
            <div className="relative z-10 min-h-screen w-full flex justify-center p-2 md:p-8 lg:p-14">
              <div className="terminal-window w-full max-w-5xl flex flex-col border border-border shadow-2xl bg-card rounded-lg overflow-hidden ring-1 ring-ring">
                <TerminalHeaderWrapper />

                <div className="relative bg-[rgba(var(--overlay-invert),0.4)] flex-1 min-h-0">
                  <div
                    className="absolute inset-0 pointer-events-none opacity-45"
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />

                  <div className="relative z-10 px-6 md:px-10 min-h-[calc(100svh-9rem)] flex flex-col">
                    {children}
                  </div>
                </div>

                <SiteStatusBar />
              </div>
            </div>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
