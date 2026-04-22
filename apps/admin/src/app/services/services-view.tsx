import type { ServiceWithStatus } from "@anipotts/lib/services";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <div className="px-4 py-2.5 border-b border-zinc-800/40">
        <h3 className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatusDot({ status }: { status: ServiceWithStatus["status"] }) {
  if (!status) {
    return (
      <span
        className="w-1.5 h-1.5 rounded-full bg-zinc-600"
        title="no checks yet"
      />
    );
  }
  const cls = status.isUp ? "bg-emerald-400" : "bg-rose-400";
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full ${cls}`}
      title={`${status.statusCode ?? "??"} at ${status.checkedAt}`}
    />
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  const isPublic = visibility === "public";
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
        isPublic
          ? "bg-amber-400/10 text-amber-300 border border-amber-400/20"
          : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40"
      }`}
    >
      {visibility}
    </span>
  );
}

export default function ServicesView({
  services,
}: {
  services: ServiceWithStatus[];
}) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-sm text-zinc-200">Services</h1>
        <span className="text-[11px] text-zinc-600">
          {services.length} active
        </span>
      </header>

      {services.length === 0 ? (
        <Section title="Registry">
          <p className="text-[12px] text-zinc-500">
            No services registered. Author a manifest in{" "}
            <code className="text-zinc-400">services/</code> and run{" "}
            <code className="text-zinc-400">
              bun run services/&lt;name&gt;.ts apply
            </code>
            .
          </p>
        </Section>
      ) : (
        <Section title="Registry">
          <ul className="divide-y divide-zinc-800/40 -my-2">
            {services.map((svc) => (
              <li
                key={svc.id}
                className="py-2 flex items-center gap-3 text-[12px]"
              >
                <StatusDot status={svc.status} />
                <span className="text-zinc-200 font-medium min-w-24">
                  {svc.name}
                </span>
                <a
                  href={`https://${svc.hostname}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 truncate"
                >
                  {svc.hostname}
                </a>
                <VisibilityBadge visibility={svc.visibility} />
                <span className="text-zinc-600 ml-auto">
                  {svc.port != null ? `:${svc.port}` : "—"}
                </span>
                <span className="text-zinc-600 w-28 text-right truncate">
                  {svc.status?.responseTimeMs != null
                    ? `${svc.status.responseTimeMs}ms`
                    : "no data"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
