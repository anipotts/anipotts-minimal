/**
 * Services monitored by status.anipotts.com.
 * Used by: status subdomain (page + cron), www admin status tab.
 */

export interface MonitoredService {
  name: string;
  url: string;
  category: "anipotts" | "project";
}

/** All services to monitor for uptime */
export const monitoredServices: MonitoredService[] = [
  // anipotts ecosystem
  { name: "anipotts.com", url: "https://anipotts.com", category: "anipotts" },
  { name: "thoughts.anipotts.com", url: "https://thoughts.anipotts.com", category: "anipotts" },
  { name: "dev.anipotts.com", url: "https://dev.anipotts.com", category: "anipotts" },
  { name: "links.anipotts.com", url: "https://links.anipotts.com", category: "anipotts" },
  { name: "updates.anipotts.com", url: "https://updates.anipotts.com", category: "anipotts" },
  { name: "metrics.anipotts.com", url: "https://metrics.anipotts.com", category: "anipotts" },
  { name: "status.anipotts.com", url: "https://status.anipotts.com", category: "anipotts" },
  { name: "lab.anipotts.com", url: "https://lab.anipotts.com", category: "anipotts" },
  { name: "docs.anipotts.com", url: "https://docs.anipotts.com", category: "anipotts" },

  // external projects
  { name: "quantercise.com", url: "https://quantercise.com", category: "project" },
  { name: "chained.chat", url: "https://chained.chat", category: "project" },
  { name: "nyupuritytest.com", url: "https://nyupuritytest.com", category: "project" },
  { name: "paragoninvestments.org", url: "https://paragoninvestments.org", category: "project" },
];
