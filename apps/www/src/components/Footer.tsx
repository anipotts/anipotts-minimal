import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 border-t border-border-subtle">
      <div className="flex flex-row flex-wrap justify-between gap-x-8 gap-y-3 text-xs uppercase tracking-widest font-mono">
        <div className="flex items-center gap-2">
          <span className="text-faint">base:</span>
          <span className="text-secondary">new york city</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-faint">focus:</span>
          <span className="text-secondary">claude systems + product execution</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-faint">status:</span>
          <Link href="/connect" className="text-accent-400 hover:underline">
            open to collaborate
          </Link>
        </div>
      </div>
    </footer>
  );
}
