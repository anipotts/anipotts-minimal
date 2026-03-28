import Link from "next/link";
import { siteConfig } from "@/content/site";

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-5 border-t border-border-subtle">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10px] uppercase tracking-wider font-mono">
        <span className="text-faint">terminal:</span>
        <span className="text-muted">_v{siteConfig.version}</span>
        <span className="text-faint mx-0.5">|</span>
        <span className="text-faint">base:</span>
        <span className="text-muted">new york city</span>
        <span className="text-faint mx-0.5">|</span>
        <span className="text-faint">focus:</span>
        <span className="text-muted">claude systems + product</span>
        <span className="text-faint mx-0.5">|</span>
        <span className="text-faint">mode:</span>
        <Link
          href="/connect"
          className="text-accent-400 hover:underline decoration-accent-400/30 underline-offset-4"
        >
          open to collab
        </Link>
      </div>
    </footer>
  );
}
