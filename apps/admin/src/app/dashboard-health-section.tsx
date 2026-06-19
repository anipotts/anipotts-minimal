import { getMiniHealth } from "@anipotts/lib/mini";
import { HealthDot, PanelShell } from "./dashboard-panels";

const HEALTH_ENDPOINTS = [
  { name: "www", url: "https://anipotts.com/api/health" },
  { name: "admin", url: "https://admin.anipotts.com/_health" },
  { name: "ingest", url: "https://anipotts-ingest.anipotts.workers.dev" },
];

export async function HealthPanel() {
  const [workerResults, miniHealth] = await Promise.all([
    Promise.allSettled(
      HEALTH_ENDPOINTS.map(async ({ name, url }) => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (!res.ok) return { name, ok: false };
          const data = (await res.json()) as { ok: boolean };
          return { name, ok: data.ok };
        } catch {
          return { name, ok: false };
        }
      }),
    ),
    getMiniHealth(),
  ]);

  const apps = workerResults.map((r) =>
    r.status === "fulfilled" ? r.value : { name: "?", ok: false },
  );
  apps.push({ name: "mini", ok: miniHealth?.ok ?? false });

  return (
    <PanelShell title="Health">
      <div className="flex gap-4">
        {apps.map((app) => (
          <div key={app.name} className="flex items-center gap-1.5">
            <HealthDot status={app.ok ? "up" : "down"} />
            <span className="text-[12px] text-zinc-400">{app.name}</span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}
