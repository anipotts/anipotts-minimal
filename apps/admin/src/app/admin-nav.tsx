"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import {
  SquaresFour,
  CurrencyDollar,
  Article,
  Code,
  HardDrives,
  Brain,
  Megaphone,
  ChatCircleDots,
  SignOut,
} from "@phosphor-icons/react";

const spokes = [
  {
    label: "Dashboard",
    href: "/",
    match: (p: string) => p === "/",
    icon: <SquaresFour size={16} weight="duotone" />,
  },
  {
    label: "Money",
    href: "/money",
    match: (p: string) => p.startsWith("/money"),
    icon: <CurrencyDollar size={16} weight="duotone" />,
  },
  {
    label: "Content",
    href: "/content",
    match: (p: string) =>
      p.startsWith("/content") ||
      p.startsWith("/record") ||
      p.startsWith("/subscribers") ||
      p.startsWith("/quick"),
    icon: <Article size={16} weight="duotone" />,
  },
  {
    label: "Code",
    href: "/code",
    match: (p: string) => p.startsWith("/code"),
    icon: <Code size={16} weight="duotone" />,
  },
  {
    label: "Ops",
    href: "/ops",
    match: (p: string) => p.startsWith("/ops"),
    icon: <HardDrives size={16} weight="duotone" />,
  },
  {
    label: "Quantercise",
    href: "/quantercise",
    match: (p: string) => p.startsWith("/quantercise"),
    icon: <Brain size={16} weight="duotone" />,
  },
  {
    label: "Marketing",
    href: "/marketing",
    match: (p: string) => p.startsWith("/marketing"),
    icon: <Megaphone size={16} weight="duotone" />,
  },
  {
    label: "Feedback",
    href: "/feedback",
    match: (p: string) => p.startsWith("/feedback"),
    icon: <ChatCircleDots size={16} weight="duotone" />,
  },
];

const subTabs: Record<string, Array<{ label: string; href: string }>> = {
  Content: [
    { label: "Pipeline", href: "/content" },
    { label: "Analytics", href: "/content/analytics" },
    { label: "Record", href: "/record" },
    { label: "Subscribers", href: "/subscribers" },
    { label: "New", href: "/quick" },
  ],
  Quantercise: [
    { label: "Dashboard", href: "/quantercise" },
    { label: "Users", href: "/quantercise/users" },
    { label: "Problems", href: "/quantercise/problems" },
    { label: "QA", href: "/quantercise/qa" },
    { label: "Analytics", href: "/quantercise/analytics" },
    { label: "Payments", href: "/quantercise/payments" },
    { label: "Flags", href: "/quantercise/flags" },
    { label: "Health", href: "/quantercise/health" },
  ],
};

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-44 shrink-0 bg-zinc-950 border-r border-zinc-800/60 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-3.5 border-b border-zinc-800/60">
        <span className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          Admin
        </span>
      </div>

      <nav className="flex-1 py-1.5 px-1.5 space-y-px overflow-y-auto">
        {spokes.map((spoke) => {
          const isActive = spoke.match(pathname);
          const tabs = subTabs[spoke.label];
          return (
            <div key={spoke.href}>
              <Link
                href={spoke.href}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors ${
                  isActive
                    ? "bg-zinc-800/60 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                }`}
              >
                {spoke.icon}
                {spoke.label}
              </Link>
              {isActive && tabs && tabs.length > 1 && (
                <div className="ml-5 mt-1 space-y-px border-l border-zinc-800/40 pl-2">
                  {tabs.map((tab) => {
                    const isSubActive =
                      tab.href === spoke.href
                        ? pathname === spoke.href ||
                          (pathname.startsWith(spoke.href + "/") &&
                            !tabs.some(
                              (t) =>
                                t.href !== spoke.href &&
                                pathname.startsWith(t.href),
                            ))
                        : pathname.startsWith(tab.href);
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={`block px-2 py-1 rounded-md text-[11px] transition-colors ${
                          isSubActive
                            ? "text-zinc-200 bg-zinc-800/40"
                            : "text-zinc-600 hover:text-zinc-400"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-1.5 py-2 border-t border-zinc-800/60">
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/30 transition-colors w-full"
        >
          <SignOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
