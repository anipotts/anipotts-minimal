"use client";

import { useState, useTransition } from "react";
import type { QCUserAction } from "@anipotts/lib/quantercise";
import { userAction } from "../../actions";
import { PanelShell } from "../../components";

interface Props {
  userId: string;
  subscription: {
    status: "free" | "active" | "canceled" | "past_due";
    plan?: "monthly" | "annual";
  };
}

const ACTIONS: Array<{
  action: QCUserAction;
  label: string;
  confirm: string;
  variant: "default" | "danger";
  showWhen?: (sub: Props["subscription"]) => boolean;
}> = [
  {
    action: "grant_monthly",
    label: "Grant Monthly",
    confirm: "Grant a free monthly subscription to this user?",
    variant: "default",
    showWhen: (sub) => sub.status === "free" || sub.status === "canceled",
  },
  {
    action: "grant_annual",
    label: "Grant Annual",
    confirm: "Grant a free annual subscription to this user?",
    variant: "default",
    showWhen: (sub) => sub.status === "free" || sub.status === "canceled",
  },
  {
    action: "revoke_subscription",
    label: "Revoke Subscription",
    confirm: "Revoke this user's subscription? This cannot be undone.",
    variant: "danger",
    showWhen: (sub) => sub.status === "active",
  },
  {
    action: "reset_stats",
    label: "Reset Stats",
    confirm: "Reset all stats for this user? This cannot be undone.",
    variant: "danger",
  },
  {
    action: "reset_progress",
    label: "Reset Progress",
    confirm: "Reset all progress for this user? This cannot be undone.",
    variant: "danger",
  },
  {
    action: "delete_user",
    label: "Delete User",
    confirm: "Permanently delete this user? This cannot be undone.",
    variant: "danger",
  },
];

export function UserActions({ userId, subscription }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    message?: string;
    error?: string;
  } | null>(null);

  function handleAction(action: QCUserAction, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    setResult(null);
    startTransition(async () => {
      const res = await userAction(userId, action);
      if ("error" in res) {
        setResult({ error: res.error });
      } else {
        setResult({ message: res.message });
      }
    });
  }

  const visible = ACTIONS.filter(
    (a) => !a.showWhen || a.showWhen(subscription),
  );

  return (
    <PanelShell title="Actions">
      <div className="flex flex-wrap gap-2">
        {visible.map((a) => (
          <button
            key={a.action}
            onClick={() => handleAction(a.action, a.confirm)}
            disabled={isPending}
            className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors disabled:opacity-50 ${
              a.variant === "danger"
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      {result?.message && (
        <p className="text-[11px] text-emerald-400 mt-2">{result.message}</p>
      )}
      {result?.error && (
        <p className="text-[11px] text-red-400 mt-2">{result.error}</p>
      )}
    </PanelShell>
  );
}
