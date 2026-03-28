import clsx from "clsx";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

interface BlockProps {
  children: ReactNode;
  className?: string;
}

/* ── Page-level layout ──────────────────────────────────────── */

export function PageFrame({ children, className }: BlockProps) {
  return (
    <div
      className={clsx("w-full flex flex-col gap-12 md:gap-16 pb-20", className)}
    >
      {children}
    </div>
  );
}

/* ── Typography primitives ──────────────────────────────────── */

export function SectionLabel({ children, className }: BlockProps) {
  return (
    <p
      className={clsx(
        "text-sm font-medium tracking-wide text-accent-400",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** @deprecated Use SectionLabel */
export const PagePrelude = SectionLabel;

export function PageTitle({ children, className }: BlockProps) {
  return (
    <h1
      className={clsx(
        "text-4xl md:text-5xl leading-tight font-semibold text-heading font-heading",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function PageSummary({ children, className }: BlockProps) {
  return (
    <p
      className={clsx(
        "text-base md:text-lg text-secondary leading-relaxed max-w-3xl",
        className,
      )}
    >
      {children}
    </p>
  );
}

/* ── Navigation ─────────────────────────────────────────────── */

interface BackLinkProps {
  href: string;
  children: ReactNode;
}

export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="text-xs font-mono text-muted hover:text-accent-400 transition-colors duration-200 inline-flex items-center gap-1.5"
    >
      <ArrowLeft size={12} />
      {children}
    </Link>
  );
}

/* ── Metadata ───────────────────────────────────────────────── */

interface MetaItem {
  label?: string;
  value: string;
}

interface MetaLineProps {
  items: MetaItem[];
  className?: string;
}

export function MetaLine({ items, className }: MetaLineProps) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-x-1.5 text-xs font-mono",
        className,
      )}
    >
      <span className="text-faint select-none">{"//"}</span>
      {items.map((item, i) => (
        <span key={`${item.value}-${i}`} className="inline-flex items-center">
          {i > 0 && <span className="text-faint mx-1 select-none">|</span>}
          {item.label && <span className="text-faint mr-1">{item.label}:</span>}
          <span className="text-tertiary">{item.value}</span>
        </span>
      ))}
    </div>
  );
}

interface TagListProps {
  tags: string[];
  className?: string;
}

export function TagList({ tags, className }: TagListProps) {
  if (tags.length === 0) return null;
  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-[10px] uppercase tracking-wider text-accent-400 border border-accent-400/20 px-2 py-0.5 rounded-sm"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (status === "live") {
    return (
      <span
        className={clsx(
          "text-[10px] uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded font-medium",
          className,
        )}
      >
        live
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span
        className={clsx(
          "text-[10px] uppercase tracking-wider text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded font-medium",
          className,
        )}
      >
        in progress
      </span>
    );
  }
  return null;
}

/* ── Section wrappers ───────────────────────────────────────── */

interface SectionBlockProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({
  label,
  children,
  className,
}: SectionBlockProps) {
  return (
    <section className={clsx("flex flex-col gap-4 md:gap-5", className)}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  );
}

export function ContentBlocks({ children, className }: BlockProps) {
  return (
    <div className={clsx("flex flex-col gap-5 md:gap-6", className)}>
      {children}
    </div>
  );
}

export function NarrativeBlock({ children, className }: BlockProps) {
  return (
    <div
      className={clsx(
        "border border-border-subtle bg-overlay-5 rounded-md p-4 md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ListBlock({ children, className }: BlockProps) {
  return (
    <div
      className={clsx("flex flex-col divide-y divide-border-subtle", className)}
    >
      {children}
    </div>
  );
}

export function CardBlock({ children, className }: BlockProps) {
  return (
    <div
      className={clsx(
        "border border-border-subtle rounded-md bg-overlay-5 p-4 md:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EndCta({ children, className }: BlockProps) {
  return (
    <div className={clsx("pt-4 border-t border-border-subtle", className)}>
      {children}
    </div>
  );
}
