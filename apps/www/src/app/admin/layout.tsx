import { cookies } from "next/headers";
import { verifySessionToken, ADMIN_COOKIE } from "@anipotts/lib/admin";
import type { Metadata } from "next";
import LoginForm from "./login-form";
import AdminNav from "./admin-nav";

export const metadata: Metadata = {
  title: "Content Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  const secret = process.env.ADMIN_PASSWORD;

  const isAuthenticated = token && secret && verifySessionToken(token, secret);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Content Admin</h1>
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">{children}</main>

      <AdminNav />
    </div>
  );
}
