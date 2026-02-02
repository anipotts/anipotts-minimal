import { FadeIn } from "@anipotts/ui";
import { FaGlobe } from "react-icons/fa";
import { createClient } from "@anipotts/lib/supabase";
import { getServiceStatuses } from "@anipotts/lib/status";
import { monitoredServices } from "@anipotts/lib/data";
import type { ServiceStatus } from "@anipotts/lib/status";

// Revalidate every 30 seconds for near-realtime status
export const revalidate = 30;

async function getStatuses(): Promise<{
  services: ServiceStatus[];
  lastChecked: string | null;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return monitored services with unknown status (before first cron)
    return {
      services: monitoredServices.map((s) => ({
        serviceName: s.name,
        serviceUrl: s.url,
        isUp: true,
        statusCode: null,
        responseTimeMs: 0,
        lastChecked: "",
        uptime24h: 100,
        uptime7d: 100,
      })),
      lastChecked: null,
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const services = await getServiceStatuses(supabase);

  // If no checks yet, fill in from the monitored services list
  if (services.length === 0) {
    return {
      services: monitoredServices.map((s) => ({
        serviceName: s.name,
        serviceUrl: s.url,
        isUp: true,
        statusCode: null,
        responseTimeMs: 0,
        lastChecked: "",
        uptime24h: 100,
        uptime7d: 100,
      })),
      lastChecked: null,
    };
  }

  const lastChecked = services.reduce(
    (latest, s) =>
      s.lastChecked > (latest ?? "") ? s.lastChecked : latest,
    null as string | null,
  );

  return { services, lastChecked };
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "never";
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default async function StatusPage() {
  const { services, lastChecked } = await getStatuses();

  const monitoredCount = services.length;
  const upCount = services.filter((s) => s.isUp).length;
  const allUp = upCount === monitoredCount;

  return (
    <div className="flex flex-col gap-8 py-8 px-4 max-w-3xl mx-auto">
      <FadeIn>
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-xs uppercase tracking-widest text-accent-400 mb-2">
              System Status
            </h1>
            <div className="flex items-center gap-2">
              {allUp ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">
                    All Systems Operational
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-yellow-400 text-sm font-medium">
                    {upCount}/{monitoredCount} Systems Operational
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted uppercase tracking-wider">
              Last Checked
            </span>
            <p className="text-xs text-tertiary">
              {formatRelativeTime(lastChecked)}
            </p>
          </div>
        </div>
      </FadeIn>

      {(["anipotts", "project"] as const).map((category) => {
        const categoryMap = Object.fromEntries(
          monitoredServices.map((s) => [s.url, s.category]),
        );
        const filtered = services.filter(
          (s) => (categoryMap[s.serviceUrl] ?? "anipotts") === category,
        );
        if (filtered.length === 0) return null;
        return (
          <div key={category} className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-muted">
              {category === "anipotts" ? "Ecosystem" : "Projects"}
            </h2>
            {filtered.map((service, i) => (
              <FadeIn key={service.serviceUrl} delay={i * 0.04}>
                <div className="flex items-center justify-between p-4 bg-input border border-border rounded-lg hover:bg-overlay-10 transition-colors">
                  <div className="flex items-center gap-3">
                    <FaGlobe className="text-muted flex-shrink-0" />
                    <div className="flex flex-col">
                      <a
                        href={service.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-body text-sm hover:text-accent-400 transition-colors"
                      >
                        {service.serviceName}
                      </a>
                      {service.responseTimeMs > 0 && (
                        <span className="text-[10px] text-faint font-mono">
                          {service.responseTimeMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted hidden md:inline">
                      {service.uptime24h}%
                      <span className="text-faint mx-1">·</span>
                      7d: {service.uptime7d}%
                    </span>
                    <span className="text-xs text-muted md:hidden">
                      {service.uptime24h}%
                    </span>
                    {service.isUp ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Up
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-red-400">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Down
                      </span>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        );
      })}

      <FadeIn delay={0.5}>
        <div className="text-center pt-8 border-t border-border-subtle">
          <p className="text-xs text-faint">
            HTTP health checks every 5 minutes • {monitoredCount} services
            monitored
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
