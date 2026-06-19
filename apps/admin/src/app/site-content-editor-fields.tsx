"use client";

import type { ReactNode } from "react";

type ContentLink = { label: string; url: string };

export function csv(tags: string[]) {
  return tags.join(", ");
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        {label}
      </span>
      {children}
    </label>
  );
}

export function LinkEditor({
  links,
  update,
}: {
  links: ContentLink[];
  update: (links: ContentLink[]) => void;
}) {
  const rows = links.length ? links : [{ label: "", url: "" }];
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        links
      </span>
      {rows.map((link, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-[160px_1fr]">
          <input
            value={link.label}
            placeholder="label"
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...link, label: event.target.value };
              update(next);
            }}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
          <input
            value={link.url}
            placeholder="https://..."
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...link, url: event.target.value };
              update(next);
            }}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </div>
      ))}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-zinc-500">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3 w-3 accent-indigo-500"
      />
      {label}
    </label>
  );
}
