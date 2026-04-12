"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";

const spokes = [
  {
    label: "Dashboard",
    href: "/",
    match: (p: string) => p === "/",
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    label: "Money",
    href: "/money",
    match: (p: string) => p.startsWith("/money"),
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    label: "Content",
    href: "/content",
    match: (p: string) =>
      p.startsWith("/content") ||
      p.startsWith("/record") ||
      p.startsWith("/subscribers") ||
      p.startsWith("/quick"),
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
        />
      </svg>
    ),
  },
  {
    label: "Code",
    href: "/code",
    match: (p: string) => p.startsWith("/code"),
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
  },
  {
    label: "Ops",
    href: "/ops",
    match: (p: string) => p.startsWith("/ops"),
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
  },
  {
    label: "Quantercise",
    href: "/quantercise",
    match: (p: string) => p.startsWith("/quantercise"),
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a23.838 23.838 0 00-1.012 5.434c3.218.81 6.503 1.246 9.834 1.246 3.331 0 6.616-.436 9.834-1.246a23.838 23.838 0 00-1.012-5.434m-15.482 0A47.998 47.998 0 0112 3.45a47.998 47.998 0 017.74 6.697"
        />
      </svg>
    ),
  },
  {
    label: "Marketing",
    href: "/marketing",
    match: (p: string) => p.startsWith("/marketing"),
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38a.814.814 0 01-1.065-.275l-.015-.024a7.29 7.29 0 01-.862-2.117m2.077-3.258a59.03 59.03 0 010-6.42m0 6.42c3.96.337 7.65 1.46 10.853 3.198m-10.853-9.618c3.96-.337 7.65-1.46 10.853-3.198M6.75 15V9"
        />
      </svg>
    ),
  },
  {
    label: "Feedback",
    href: "/feedback",
    match: (p: string) => p.startsWith("/feedback"),
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
        />
      </svg>
    ),
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
  Quantercise: [{ label: "Dashboard", href: "/quantercise" }],
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
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
