import { FadeIn } from "@anipotts/ui";
import type { ServiceStatus } from "@anipotts/lib/status";
import { monitoredServices } from "@anipotts/lib/data";

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

export default function StatusSection({
  services,
  lastChecked,
}: {
  services: ServiceStatus[];
  lastChecked: string | null;
}) {
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
    <div className="flex flex-col gap-4">
      <FadeIn>
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                allUp ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                allUp ? "text-green-400" : "text-yellow-400"
              }`}
            >
              {allUp ? "All Operational" : `${upCount}/${monitoredCount} Up`}
            </span>
          </div>
          <span className="text-[10px] text-faint">
            checked {formatRelativeTime(lastChecked)}
          </span>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-muted mb-2">
            ecosystem
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {ecosystemServices.map((service) => (
              <a
                key={service.serviceUrl}
                href={service.serviceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-2 bg-input border border-border-subtle rounded hover:border-accent-400/30 transition-colors group"
                title={`${service.uptime24h}% uptime`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    service.isUp
                      ? "bg-green-500"
                      : "bg-red-500 animate-pulse"
                  }`}
                />
                <span className="text-xs text-secondary truncate group-hover:text-accent-400 transition-colors">
                  {service.serviceName
                    .replace(".anipotts.com", "")
                    .replace("anipotts.com", "www")}
                </span>
              </a>
            ))}
          </div>
        </div>
      </FadeIn>

      {projectServices.length > 0 && (
        <FadeIn delay={0.1}>
          <div>
            <h2 className="text-[10px] uppercase tracking-widest text-muted mb-2">
              projects
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {projectServices.map((service) => (
                <a
                  key={service.serviceUrl}
                  href={service.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 bg-input border border-border-subtle rounded hover:border-accent-400/30 transition-colors group"
                  title={`${service.uptime24h}% uptime`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      service.isUp
                        ? "bg-green-500"
                        : "bg-red-500 animate-pulse"
                    }`}
                  />
                  <span className="text-xs text-secondary truncate group-hover:text-accent-400 transition-colors">
                    {service.serviceName}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.15}>
        <p className="text-[10px] text-faint text-center pt-2 border-t border-border-subtle">
          {monitoredCount} services checked every 5 minutes
        </p>
      </FadeIn>
    </div>
  );
}
