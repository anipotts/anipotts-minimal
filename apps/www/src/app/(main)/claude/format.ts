/**
 * Format a duration in minutes to a human-readable string like "2h 05m" or "45m".
 */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hours <= 0) return `${mins}m`;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
}
