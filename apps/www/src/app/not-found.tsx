import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-medium font-heading">404</h1>
      <p className="text-muted font-mono text-sm">page not found</p>
      <Link
        href="/"
        className="text-xs text-accent-400 hover:underline font-mono uppercase tracking-widest"
      >
        go home
      </Link>
    </div>
  );
}
