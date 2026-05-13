import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-prose px-6 pt-24 pb-24">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
        404
      </p>
      <h1 className="mt-4 text-2xl font-medium">No artifact at that path.</h1>
      <p className="mt-3 text-[color:var(--muted)]">
        The bots haven&rsquo;t generated this one, or you&rsquo;re looking for
        something that doesn&rsquo;t exist yet.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block font-mono text-xs text-[color:var(--accent)] hover:underline"
      >
        ← back
      </Link>
    </main>
  );
}
