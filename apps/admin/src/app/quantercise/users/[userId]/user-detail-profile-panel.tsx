import type { QCUser } from "@anipotts/lib/quantercise";
import { PanelShell } from "../../components";

export function UserProfilePanel({ user }: { user: QCUser }) {
  return (
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
  );
}
