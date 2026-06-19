"use client";

import { BUTTONDOWN_STATUS_COLORS } from "@/lib/constants";
import type {
  ButtondownFeedback,
  ButtondownState,
} from "./buttondown-card-types";

export function CreateDraftButton({
  isPending,
  onCreateDraft,
}: {
  isPending: boolean;
  onCreateDraft: () => void;
}) {
  return (
    <button
      onClick={onCreateDraft}
      disabled={isPending}
      className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-md text-xs text-zinc-300 transition-colors"
    >
      {isPending ? "Creating..." : "Create Email Draft"}
    </button>
  );
}

export function ButtondownEditForm({
  subject,
  body,
  isPending,
  onSubjectChange,
  onBodyChange,
  onSave,
  onCancel,
}: {
  subject: string;
  body: string;
  isPending: boolean;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={subject}
        onChange={(e) => onSubjectChange(e.target.value)}
        placeholder="Subject"
        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 admin-input"
      />
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        rows={6}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 font-mono admin-input resize-y"
      />
      <div className="flex gap-1.5">
        <button
          onClick={onSave}
          disabled={isPending}
          className="text-[11px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white disabled:opacity-50"
        >
          {isPending ? "..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ButtondownEmailPanel({
  feedback,
  emailState,
  isPending,
  scheduleDate,
  onCheckStatus,
  onStartEdit,
  onScheduleDateChange,
  onSchedule,
  onDelete,
}: {
  feedback: ButtondownFeedback;
  emailState: ButtondownState;
  isPending: boolean;
  scheduleDate: string;
  onCheckStatus: () => void;
  onStartEdit: () => void;
  onScheduleDateChange: (value: string) => void;
  onSchedule: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-2">
      {feedback && (
        <p
          className={`text-[11px] ${feedback.type === "error" ? "text-red-400" : "text-green-400"}`}
        >
          {feedback.message}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        {emailState.status && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${BUTTONDOWN_STATUS_COLORS[emailState.status] || BUTTONDOWN_STATUS_COLORS.draft}`}
          >
            {emailState.status}
          </span>
        )}
        {emailState.subject && (
          <span className="text-xs text-zinc-300 truncate">
            {emailState.subject}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={onCheckStatus}
          disabled={isPending}
          className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 disabled:opacity-50"
        >
          Refresh
        </button>
        <button
          onClick={onStartEdit}
          className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
        >
          Edit
        </button>
        {emailState.status === "draft" && (
          <>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => onScheduleDateChange(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 admin-input"
            />
            <button
              onClick={onSchedule}
              disabled={isPending || !scheduleDate}
              className="text-[11px] px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white disabled:opacity-50"
            >
              Schedule
            </button>
          </>
        )}
        <button
          onClick={onDelete}
          disabled={isPending}
          className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-red-400 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
