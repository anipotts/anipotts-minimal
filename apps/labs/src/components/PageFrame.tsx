import Link from "next/link";
import type { ReactNode } from "react";

export function PageFrame({
  children,
  back,
}: {
  children: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <main className="mx-auto max-w-prose px-6 pt-16 pb-24 md:pt-24">
      {back && (
        <Link
          href={back.href}
          className="font-mono text-xs text-[color:var(--muted)] hover:text-[color:var(--accent)]"
        >
          ← {back.label}
        </Link>
      )}
      {children}
      <footer className="mt-24 border-t border-[color:var(--border)] pt-6 font-mono text-xs text-[color:var(--muted)]">
        <p>
          Source:{" "}
          <a
            href="https://github.com/anipotts/labs"
            className="hover:text-[color:var(--accent)]"
          >
            anipotts/labs
          </a>{" "}
          · Site:{" "}
          <a
            href="https://github.com/anipotts/anipotts.com/tree/main/apps/labs"
            className="hover:text-[color:var(--accent)]"
          >
            anipotts.com/apps/labs
          </a>
        </p>
      </footer>
    </main>
  );
}
