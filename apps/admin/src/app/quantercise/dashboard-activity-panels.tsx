import type { QCDashboard } from "@anipotts/lib/quantercise";
import { PanelShell } from "./components";

export function ActivityPanel({ data }: { data: QCDashboard }) {
  const events = data.recentActivity.slice(0, 5);

  if (events.length === 0) {
    return (
      <PanelShell title="Recent Activity">
        <p className="text-[12px] text-zinc-600">No recent events</p>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Recent Activity">
      <div className="space-y-2">
        {events.map((event) => {
          const time = new Date(event.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
          return (
            <div key={event.id} className="flex justify-between items-baseline">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-zinc-400 truncate block">
                  {event.userName || event.userEmail}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {event.eventType}
                </span>
              </div>
              <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                {time}
              </span>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

export function ContentStatsPanel({ data }: { data: QCDashboard }) {
  const { contentStats } = data;
  const stages = [
    { key: "idea", label: "Idea" },
    { key: "scripting", label: "Scripting" },
    { key: "recording", label: "Recording" },
    { key: "editing", label: "Editing" },
    { key: "ready", label: "Ready" },
    { key: "published", label: "Published" },
  ];

  return (
    <PanelShell title="Content Pipeline">
      <div className="flex gap-3">
        {stages.map((s) => (
          <div key={s.key} className="text-center">
            <div className="text-[14px] font-medium text-zinc-200">
              {contentStats[s.key] ?? 0}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wide">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export function LastUpdatedPanel({ timestamp }: { timestamp: string }) {
  const updated = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <PanelShell title="Last Updated">
      <p className="text-[12px] text-zinc-500">{updated}</p>
    </PanelShell>
  );
}
