"use client";

import { FadeIn } from "@anipotts/ui";
import { ThemeToggle } from "@anipotts/ui/window";

export default function SiteStatusBar() {
  return (
    <FadeIn delay={0.4}>
      <div className="border-t border-border-subtle bg-input px-6 md:px-10 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted font-mono">
        <div className="flex items-center gap-3">
          <span>stable</span>
          <span className="text-faint">main</span>
        </div>
        <ThemeToggle />
      </div>
    </FadeIn>
  );
}
