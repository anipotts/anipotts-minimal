import type { QCFeatureFlag } from "@anipotts/lib/quantercise";
import { EmptyState, PanelShell } from "../components";
import { FlagToggle } from "./flag-toggle";

type FlagGroup = {
  category: string;
  flags: QCFeatureFlag[];
};

export function FlagsSummary({
  flags,
  source,
}: {
  flags: QCFeatureFlag[];
  source: string;
}) {
  return (
    <div className="flex gap-4 mb-4 text-[10px] text-zinc-500">
      <span>
        <span className="text-zinc-200 font-medium">{flags.length}</span> flags
      </span>
      <span>
        <span className="text-emerald-400 font-medium">
          {flags.filter((f) => f.active).length}
        </span>{" "}
        active
      </span>
      <span>Source: {source}</span>
    </div>
  );
}

export function FlagsGroups({ groups }: { groups: FlagGroup[] }) {
  if (groups.length === 0) {
    return (
      <PanelShell title="Feature Flags">
        <EmptyState message="No feature flags configured." />
      </PanelShell>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <PanelShell key={group.category} title={group.category}>
          <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
            {group.flags.map((flag) => (
              <FlagRow key={flag.id} flag={flag} />
            ))}
          </div>
        </PanelShell>
      ))}
    </div>
  );
}

function FlagRow({ flag }: { flag: QCFeatureFlag }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 group">
      <FlagToggle
        flagId={flag.id}
        initialActive={flag.active}
        rolloutPercentage={flag.rolloutPercentage}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-zinc-200 font-medium">
            {flag.name}
          </span>
          <span className="text-[10px] text-zinc-600 font-mono">
            {flag.key}
          </span>
        </div>
        {flag.description && (
          <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
            {flag.description}
          </div>
        )}
        <div className="flex gap-3 mt-1 text-[9px] text-zinc-600">
          <span>Category: {flag.category}</span>
          <span>Rollout: {flag.rolloutPercentage}%</span>
        </div>
      </div>
    </div>
  );
}
