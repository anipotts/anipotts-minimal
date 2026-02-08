"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

const tabs = [
  { key: "stack", label: "Stack" },
  { key: "metrics", label: "Metrics" },
  { key: "activity", label: "Activity" },
  { key: "status", label: "Status" },
] as const;

export type DevSection = (typeof tabs)[number]["key"];

export default function DevSectionTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const current = (searchParams.get("section") as DevSection) || "stack";

  const handleTab = useCallback(
    (key: DevSection) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "stack") {
        params.delete("section");
      } else {
        params.set("section", key);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleTab(tab.key)}
          className={`px-3 py-1 text-[10px] uppercase tracking-wider rounded-sm border transition-all duration-300 ${
            current === tab.key
              ? "border-accent-400 text-accent-400 bg-accent-400/10"
              : "border-border text-muted hover:border-overlay-30 hover:text-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
