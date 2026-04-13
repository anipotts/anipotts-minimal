import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getQCUser } from "@anipotts/lib/quantercise";
import {
  getQCEnv,
  QCPageLayout,
  PanelShell,
  PanelSkeleton,
  MetricCard,
  StatusBadge,
  ErrorPanel,
} from "../../components";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

async function UserDetail({ userId }: { userId: string }) {
  let data;
  try {
    data = await getQCUser(getQCEnv(), userId);
  } catch (e) {
    if (e instanceof Error && e.message.includes("404")) {
      notFound();
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="User" message={msg} />;
  }

  const { user } = data;
  const sub = user.subscription;
  const stats = user.stats;

  return (
    <div className="space-y-4">
      <PanelShell title="Profile">
        <div className="flex items-start gap-4">
          {user.picture && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.picture}
              alt=""
              className="w-10 h-10 rounded-full bg-zinc-800"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[14px] text-zinc-200 font-medium">
              {user.name || user.email}
            </div>
            {user.name && (
              <div className="text-[11px] text-zinc-500">{user.email}</div>
            )}
            <div className="flex gap-4 mt-2 text-[10px] text-zinc-600">
              {user.signupDate && (
                <span>
                  Joined{" "}
                  {new Date(user.signupDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {user.lastActivity && (
                <span>
                  Last active{" "}
                  {new Date(user.lastActivity).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </PanelShell>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PanelShell title="Subscription">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-zinc-500">Status</span>
              <StatusBadge status={sub.status} />
            </div>
            {sub.plan && (
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-zinc-500">Plan</span>
                <span className="text-[12px] text-zinc-300">{sub.plan}</span>
              </div>
            )}
            {sub.source && (
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-zinc-500">Source</span>
                <span className="text-[12px] text-zinc-300">{sub.source}</span>
              </div>
            )}
            {sub.currentPeriodEnd && (
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-zinc-500">Renews</span>
                <span className="text-[12px] text-zinc-300">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {sub.adminGranted && (
              <div className="text-[10px] text-amber-400/70 mt-1">
                Admin-granted subscription
              </div>
            )}
          </div>
        </PanelShell>

        {stats && (
          <PanelShell title="Stats">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Total Solved"
                value={stats.totalSolved}
                color="text-blue-400"
              />
              <MetricCard
                label="Points"
                value={stats.totalPoints.toLocaleString()}
                color="text-emerald-400"
              />
              <MetricCard
                label="Streak"
                value={`${stats.currentStreak}d`}
                color="text-amber-400"
              />
              <MetricCard label="Easy" value={stats.easySolved} />
            </div>
            <div className="flex gap-4 mt-3 text-[10px] text-zinc-500">
              <span>Medium: {stats.mediumSolved}</span>
              <span>Hard: {stats.hardSolved}</span>
            </div>
          </PanelShell>
        )}
      </div>

      <UserActions userId={userId} subscription={sub} />
    </div>
  );
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return (
    <QCPageLayout title="User Detail">
      <Suspense
        fallback={
          <div className="space-y-4">
            <PanelSkeleton title="Profile" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PanelSkeleton title="Subscription" />
              <PanelSkeleton title="Stats" />
            </div>
          </div>
        }
      >
        <UserDetail userId={userId} />
      </Suspense>
    </QCPageLayout>
  );
}
