import { FadeIn } from "@anipotts/ui";

interface ContributionDay {
  contributionCount: number;
  date: string;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-[var(--input-bg)]";
  if (count <= 2) return "bg-[var(--accent-400)]/20";
  if (count <= 5) return "bg-[var(--accent-400)]/40";
  if (count <= 10) return "bg-[var(--accent-400)]/60";
  return "bg-[var(--accent-400)]/80";
}

export default function ContributionHeatmap({
  days,
  fetchedAt,
}: {
  days: ContributionDay[];
  fetchedAt: string | null;
}) {
  if (!days || days.length === 0) return null;

  // Build 52-week grid (7 rows x 52 cols)
  const weeks: ContributionDay[][] = [];
  let currentWeek: ContributionDay[] = [];

  // Pad the beginning to align with day of week
  const firstDate = new Date(days[0].date + "T00:00:00Z");
  const startPadding = firstDate.getUTCDay();
  for (let i = 0; i < startPadding; i++) {
    currentWeek.push({ contributionCount: -1, date: "" });
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const totalContributions = days.reduce((sum, d) => sum + d.contributionCount, 0);

  return (
    <FadeIn>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {totalContributions.toLocaleString()} contributions in the last year
          </p>
          <div className="flex items-center gap-1 text-[11px] text-faint">
            <span>Less</span>
            {[0, 2, 5, 10, 15].map((n) => (
              <div key={n} className={`w-2.5 h-2.5 rounded-sm ${getIntensityClass(n)}`} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-[3px] overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={`w-2.5 h-2.5 rounded-sm ${
                    day.contributionCount < 0
                      ? "bg-transparent"
                      : getIntensityClass(day.contributionCount)
                  }`}
                  title={
                    day.date
                      ? `${day.date}: ${day.contributionCount} contribution${day.contributionCount !== 1 ? "s" : ""}`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
