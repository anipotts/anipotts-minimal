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
];

const contentSubTabs = [
  { label: "Pipeline", href: "/content" },
  { label: "Analytics", href: "/content/analytics" },
  { label: "Record", href: "/record" },
  { label: "Subscribers", href: "/subscribers" },
  { label: "New", href: "/quick" },
];

export default function AdminNav() {
  const pathname = usePathname();

  const contentSpoke = spokes[2];
  const isContentSpoke = contentSpoke?.match(pathname) ?? false;

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
          return (
            <Link
              key={spoke.href}
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
          );
        })}

        {/* Content sub-tabs */}
        {isContentSpoke && (
          <div className="ml-5 mt-1 space-y-px border-l border-zinc-800/40 pl-2">
            {contentSubTabs.map((tab) => {
              const isSubActive =
                tab.href === "/content"
                  ? pathname === "/content" ||
                    (pathname.startsWith("/content/") &&
                      !pathname.startsWith("/content/analytics"))
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
