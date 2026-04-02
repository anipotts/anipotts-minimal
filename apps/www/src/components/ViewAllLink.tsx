import Link from "next/link";
import type { ReactNode } from "react";

export default function ViewAllLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-sm border border-accent-400/40 text-accent-400 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-accent-400/10"
    >
      {children}
    </Link>
  );
}
