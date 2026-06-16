/**
 * Services monitored for uptime.
 * Used by: dev section status tab, admin status tab.
 */

export interface MonitoredService {
  name: string;
  url: string;
  category: "anipotts" | "project";
}

/** All services to monitor for uptime */
export const monitoredServices: MonitoredService[] = [
  // anipotts ecosystem (all paths on anipotts.com)
  { name: "anipotts.com", url: "https://anipotts.com", category: "anipotts" },
  {
    name: "anipotts.com/thoughts",
    url: "https://anipotts.com/thoughts",
    category: "anipotts",
  },
  {
    name: "anipotts.com/work",
    url: "https://anipotts.com/work",
    category: "anipotts",
  },
  {
    name: "anipotts.com/connect",
    url: "https://anipotts.com/connect",
    category: "anipotts",
  },
  {
    name: "anipotts.com/dev",
    url: "https://anipotts.com/dev",
    category: "anipotts",
  },

  // external projects
  {
    name: "quantercise.com",
    url: "https://quantercise.com",
    category: "project",
  },
  {
    name: "nyupuritytest.com",
    url: "https://nyupuritytest.com",
    category: "project",
  },
  {
    name: "paragoninvestments.org",
    url: "https://paragoninvestments.org",
    category: "project",
  },
];
