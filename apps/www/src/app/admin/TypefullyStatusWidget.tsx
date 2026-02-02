"use client";

import { useEffect, useState } from "react";
import { getTypefullyQueue } from "./actions";

export default function TypefullyStatusWidget() {
  const [status, setStatus] = useState<{
    connected: boolean;
    used: number;
    limit: number;
    queued: number;
  } | null>(null);

  useEffect(() => {
    getTypefullyQueue().then((queue) => {
      if (queue) {
        setStatus({
          connected: queue.connected,
          used: queue.publishedThisMonth,
          limit: queue.monthlyLimit,
          queued: queue.scheduledCount,
        });
      } else {
        setStatus({ connected: false, used: 0, limit: 15, queued: 0 });
      }
    });
  }, []);

  if (!status) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          status.connected ? "bg-green-500" : "bg-gray-500"
        }`}
      />
      {status.connected ? (
        <span>
          {status.used}/{status.limit} posts | {status.queued} queued
        </span>
      ) : (
        <span>Typefully</span>
      )}
    </div>
  );
}
