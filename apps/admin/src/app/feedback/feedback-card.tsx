"use client";

import type { QCFeedbackIssue } from "@anipotts/lib/quantercise";

export function FeedbackIssueCard({
  issue,
  isExpanded,
  isUpdating,
  onToggleExpanded,
  onToggleState,
}: {
  issue: QCFeedbackIssue;
  isExpanded: boolean;
  isUpdating: boolean;
  onToggleExpanded: () => void;
  onToggleState: (issue: QCFeedbackIssue) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50">
      <button
        onClick={onToggleExpanded}
        className="w-full px-4 py-3 text-left flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                issue.state === "open"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-zinc-500/10 text-zinc-400"
              }`}
            >
              {issue.state}
            </span>
            {issue.labels.map((label) => (
              <span
                key={label.name}
                className="admin-badge inline-block px-1.5 py-0.5 rounded text-[9px] font-medium text-white/90"
                style={{ backgroundColor: `#${label.color}` }}
              >
                {label.name}
              </span>
            ))}
            <span className="text-[10px] text-zinc-700">#{issue.number}</span>
          </div>
          <p className="text-[12px] text-zinc-200 leading-relaxed">
            {issue.title}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-600">
            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
            {issue.reportedBy && <span>by {issue.reportedBy}</span>}
          </div>
        </div>
        <span className="text-zinc-700 text-[10px] shrink-0">
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-zinc-800/40">
          {issue.body && (
            <div className="mt-3 text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto admin-scroll">
              {issue.body}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 flex-wrap text-[10px] text-zinc-600">
            {issue.contactEmail && (
              <span>
                Contact:{" "}
                <span className="text-zinc-400">{issue.contactEmail}</span>
              </span>
            )}
            {issue.pageUrl && (
              <span>
                Page: <span className="text-zinc-400">{issue.pageUrl}</span>
              </span>
            )}
            {issue.screenshot?.startsWith("https://") && (
              <a
                href={issue.screenshot}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 transition-colors"
              >
                View screenshot ↗
              </a>
            )}
            <span>
              Updated: {new Date(issue.updated_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            >
              View on GitHub ↗
            </a>
            <button
              onClick={() => onToggleState(issue)}
              disabled={isUpdating}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors disabled:opacity-50 ${
                issue.state === "open"
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {isUpdating
                ? "Updating..."
                : issue.state === "open"
                  ? "Close Issue"
                  : "Reopen Issue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
