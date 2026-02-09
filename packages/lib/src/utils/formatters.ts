/**
 * Short relative time for dashboards — "just now", "5m ago", "3h ago", "2d ago"
 */
export function formatShortRelativeTime(isoString: string | null): string {
  if (!isoString) return "never";
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Format a number with locale-aware commas
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
