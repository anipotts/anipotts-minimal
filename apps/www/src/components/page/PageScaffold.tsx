import clsx from "clsx";
import type { ReactNode } from "react";

interface BlockProps {
  children: ReactNode;
  className?: string;
}

export function PageFrame({ children, className }: BlockProps) {
  return (
    <div className={clsx("w-full flex flex-col gap-12 md:gap-16 pb-20", className)}>
      {children}
    </div>
  );
}

export function PagePrelude({ children, className }: BlockProps) {
  return (
    <p className={clsx("text-sm font-medium tracking-wide text-accent-400", className)}>
      {children}
    </p>
  );
}

export function PageTitle({ children, className }: BlockProps) {
  return (
    <h1 className={clsx("text-4xl md:text-5xl leading-tight font-semibold text-heading font-heading", className)}>
      {children}
    </h1>
  );
}

export function PageSummary({ children, className }: BlockProps) {
  return (
    <p className={clsx("text-base md:text-lg text-secondary leading-relaxed max-w-3xl", className)}>
      {children}
    </p>
  );
}

export function ContentBlocks({ children, className }: BlockProps) {
  return <div className={clsx("flex flex-col gap-8", className)}>{children}</div>;
}

export function NarrativeBlock({ children, className }: BlockProps) {
  return (
    <div className={clsx("border border-border-subtle bg-overlay-5 rounded-md p-5 md:p-6", className)}>
      {children}
    </div>
  );
}

export function ListBlock({ children, className }: BlockProps) {
  return <div className={clsx("flex flex-col divide-y divide-border-subtle", className)}>{children}</div>;
}

export function CardBlock({ children, className }: BlockProps) {
  return (
    <div className={clsx("border border-border-subtle rounded-md bg-overlay-5 p-4 md:p-5", className)}>
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
