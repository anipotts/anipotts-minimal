import { cookies } from "next/headers";
import { verifySessionToken, ADMIN_COOKIE } from "@anipotts/lib/admin";
import { getEnv } from "@anipotts/lib/env";
import { JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";
import LoginForm from "./login-form";
import AdminNav from "./admin-nav";
import "./globals.css";
import "./admin.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin",
  },
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = getEnv("ADMIN_PASSWORD");

  const isAuthenticated = token && secret && verifySessionToken(token, secret);

  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable}`}>
      <head>
        <meta name="theme-color" content="#020308" />
      </head>
      <body className="font-mono antialiased">
        {!isAuthenticated ? (
          <div className="min-h-screen flex items-center justify-center p-4">
            <LoginForm />
          </div>
        ) : (
          <div className="h-screen flex overflow-hidden">
            <AdminNav />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        )}
      </body>
    </html>
  );
}
