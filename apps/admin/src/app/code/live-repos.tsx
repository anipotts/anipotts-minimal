"use client";

import { useMiniStream } from "@anipotts/lib/mini/stream";
import type { InitialCodeData } from "./live-repos-model";
import { ReposSection, SessionsSection } from "./live-repos-sections";

export default function LiveCodeSections({
  initial,
}: {
  initial: InitialCodeData;
}) {
  const stream = useMiniStream();
  const repos = stream.repos ?? initial.repos;
  const sessions = stream.sessions ?? initial.sessions;
  const isLive = stream.connected;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-2 h-2 rounded-full ${isLive ? "bg-[#61AEBA] animate-pulse" : "bg-zinc-600"}`}
        />
        <span className="text-[11px] text-zinc-500">
          {isLive ? "Live" : "Cached"}
        </span>
      </div>
      <ReposSection repos={repos} live={isLive} />
      <SessionsSection sessions={sessions} live={isLive} />
    </div>
  );
}
