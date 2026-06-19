import Link from "next/link";
import type { QCUser } from "@anipotts/lib/quantercise";
import { EmptyState, PanelShell, StatusBadge } from "../components";

type UserCounts = {
  total: number;
  active: number;
  free: number;
};

export function UsersSummary({ counts }: { counts: UserCounts }) {
  return (
    <div className="flex gap-6 mb-4">
      <div className="text-[12px] text-zinc-500">
        <span className="text-zinc-200 font-medium">{counts.total}</span> total
      </div>
      <div className="text-[12px] text-zinc-500">
        <span className="text-emerald-400 font-medium">{counts.active}</span>{" "}
        active
      </div>
      <div className="text-[12px] text-zinc-500">
        <span className="text-zinc-400 font-medium">{counts.free}</span> free
      </div>
    </div>
  );
}

export function UsersPanel({
  search,
  users,
}: {
  search?: string;
  users: QCUser[];
}) {
  return (
    <PanelShell title={`Users${search ? ` matching "${search}"` : ""}`}>
      {users.length === 0 ? (
        <EmptyState
          message={search ? "No users match that search." : "No users found."}
        />
      ) : (
        <div className="divide-y divide-zinc-800/40 -mx-4 -mb-4">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </PanelShell>
  );
}

function UserRow({ user }: { user: QCUser }) {
  const plan = user.subscription.plan ?? "free";
  return (
    <Link
      href={`/quantercise/users/${user.id}`}
      className="flex items-center gap-4 px-4 py-2.5 rounded-md hover:bg-zinc-800/30 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-200 truncate group-hover:text-white">
          {user.email}
        </div>
        {user.name && (
          <div className="text-[10px] text-zinc-500 truncate">{user.name}</div>
        )}
      </div>
      <StatusBadge status={user.subscription.status} />
      <span className="text-[10px] text-zinc-500 w-14 text-right">{plan}</span>
      {user.stats && (
        <span className="text-[11px] font-mono text-zinc-400 w-12 text-right">
          {user.stats.totalPoints.toLocaleString()}
          <span className="text-[9px] text-zinc-600"> pts</span>
        </span>
      )}
      {user.stats && (
        <span className="text-[11px] font-mono text-amber-400/70 w-8 text-right">
          {user.stats.currentStreak}
          <span className="text-[9px] text-zinc-600">d</span>
        </span>
      )}
    </Link>
  );
}
