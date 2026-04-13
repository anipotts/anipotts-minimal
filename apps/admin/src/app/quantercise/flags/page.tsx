import { Suspense } from "react";
import { getQCFeatureFlags } from "@anipotts/lib/quantercise";
import type { QCFeatureFlag } from "@anipotts/lib/quantercise";
import {
  getQCEnv,
  QCPageLayout,
  PanelShell,
  PanelSkeleton,
  EmptyState,
  ErrorPanel,
} from "../components";
import { FlagToggle } from "./flag-toggle";

export const dynamic = "force-dynamic";

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

async function FlagsContent() {
  let data;
  try {
    data = await getQCFeatureFlags(getQCEnv());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Feature Flags" message={msg} />;
  }

  const { flags, source } = data;

  const categories = [...new Set(flags.map((f) => f.category))].sort();
  const grouped = categories.map((cat) => ({
    category: cat,
    flags: flags.filter((f) => f.category === cat),
  }));

  return (
    <>
      <div className="flex gap-4 mb-4 text-[10px] text-zinc-500">
        <span>
          <span className="text-zinc-200 font-medium">{flags.length}</span>{" "}
          flags
        </span>
        <span>
          <span className="text-emerald-400 font-medium">
            {flags.filter((f) => f.active).length}
          </span>{" "}
          active
        </span>
        <span>Source: {source}</span>
      </div>

      {grouped.length === 0 ? (
        <PanelShell title="Feature Flags">
          <EmptyState message="No feature flags configured." />
        </PanelShell>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <PanelShell key={g.category} title={g.category}>
              <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
                {g.flags.map((flag) => (
                  <FlagRow key={flag.id} flag={flag} />
                ))}
              </div>
            </PanelShell>
          ))}
        </div>
      )}
    </>
  );
}

export default function FlagsPage() {
  return (
    <QCPageLayout title="Feature Flags">
      <Suspense
        fallback={
          <div className="space-y-4">
            <PanelSkeleton title="Feature Flags" />
            <PanelSkeleton title="Feature Flags" />
          </div>
        }
      >
        <FlagsContent />
      </Suspense>
    </QCPageLayout>
  );
}
