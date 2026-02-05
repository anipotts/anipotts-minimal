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

  const categoryMap = Object.fromEntries(
    monitoredServices.map((s) => [s.url, s.category]),
  );
  const ecosystemServices = services.filter(
    (s) => (categoryMap[s.serviceUrl] ?? "anipotts") === "anipotts",
  );
  const projectServices = services.filter(
    (s) => categoryMap[s.serviceUrl] === "project",
  );

  return (
    <div className="flex flex-col gap-4 py-6 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            {allUp ? (
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
            )}
            <span className={`text-sm font-medium ${allUp ? "text-green-400" : "text-yellow-400"}`}>
              {allUp ? "All Operational" : `${upCount}/${monitoredCount} Up`}
            </span>
          </div>
          <span className="text-[10px] text-faint">
            checked {formatRelativeTime(lastChecked)}
          </span>
        </div>
      </FadeIn>

      {/* Ecosystem Grid */}
      <FadeIn delay={0.05}>
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-muted mb-2">ecosystem</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {ecosystemServices.map((service) => (
              <a
                key={service.serviceUrl}
                href={service.serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-2 bg-input border border-border-subtle rounded hover:border-accent-400/30 transition-colors group"
                title={`${service.uptime24h}% uptime • ${service.responseTimeMs}ms`}
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${service.isUp ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                <span className="text-xs text-secondary truncate group-hover:text-accent-400 transition-colors">
                  {service.serviceName.replace(".anipotts.com", "").replace("anipotts.com", "www")}
                </span>
              </a>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Projects Grid */}
      {projectServices.length > 0 && (
        <FadeIn delay={0.1}>
          <div>
            <h2 className="text-[10px] uppercase tracking-widest text-muted mb-2">projects</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {projectServices.map((service) => (
                <a
                  key={service.serviceUrl}
                  href={service.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 bg-input border border-border-subtle rounded hover:border-accent-400/30 transition-colors group"
                  title={`${service.uptime24h}% uptime • ${service.responseTimeMs}ms`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${service.isUp ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                  <span className="text-xs text-secondary truncate group-hover:text-accent-400 transition-colors">
                    {service.serviceName}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Footer */}
      <FadeIn delay={0.15}>
        <p className="text-[10px] text-faint text-center pt-2 border-t border-border-subtle">
          {monitoredCount} services • 5min intervals
        </p>
      </FadeIn>
    </div>
  );
}
