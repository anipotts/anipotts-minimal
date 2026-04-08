"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  pushToButtondown,
  fetchButtondownEmailStatus,
  editButtondownEmail,
  removeButtondownEmail,
} from "../../actions";
import { BUTTONDOWN_STATUS_COLORS } from "@/lib/constants";

interface ButtondownState {
  emailId?: string;
  status?: string;
  subject?: string;
  body?: string;
}

export default function ButtondownCard({
  contentId,
  initialEmailId,
}: {
  contentId: string;
  initialEmailId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [emailState, setEmailState] = useState<ButtondownState>({
    emailId: initialEmailId,
  });
  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const router = useRouter();

  function handleCreateDraft() {
    startTransition(async () => {
      setFeedback(null);
      const result = await pushToButtondown(contentId);
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({ type: "success", message: "Draft created" });
        setEmailState({ emailId: result.emailId, status: "draft" });
        router.refresh();
      }
    });
  }

  function handleCheckStatus() {
    if (!emailState.emailId) return;
    startTransition(async () => {
      setFeedback(null);
      const result = await fetchButtondownEmailStatus(emailState.emailId!);
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else if (result.email) {
        setEmailState({
          emailId: emailState.emailId,
          status: result.email.status,
          subject: result.email.subject,
          body: result.email.body,
        });
      }
    });
  }

  function startEdit() {
    setEditSubject(emailState.subject || "");
    setEditBody(emailState.body || "");
    setEditing(true);
  }

  function handleSave() {
    if (!emailState.emailId) return;
    startTransition(async () => {
      setFeedback(null);
      const result = await editButtondownEmail(emailState.emailId!, {
        subject: editSubject,
        body: editBody,
      });
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({ type: "success", message: "Updated" });
        setEmailState((prev) => ({
          ...prev,
          subject: editSubject,
          body: editBody,
        }));
        setEditing(false);
      }
    });
  }

  function handleSchedule() {
    if (!emailState.emailId || !scheduleDate) return;
    startTransition(async () => {
      setFeedback(null);
      const result = await editButtondownEmail(emailState.emailId!, {
        status: "scheduled",
        publish_date: new Date(scheduleDate).toISOString(),
      });
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({ type: "success", message: "Scheduled" });
        setEmailState((prev) => ({ ...prev, status: "scheduled" }));
      }
    });
  }

  function handleDelete() {
    if (!emailState.emailId || !confirm("Delete this email?")) return;
    startTransition(async () => {
      setFeedback(null);
      const result = await removeButtondownEmail(emailState.emailId!);
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setEmailState({});
        setEditing(false);
      }
    });
  }

  if (!emailState.emailId) {
    return (
      <button
        onClick={handleCreateDraft}
        disabled={isPending}
        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-md text-xs text-zinc-300 transition-colors"
      >
        {isPending ? "Creating..." : "Create Email Draft"}
      </button>
    );
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={editSubject}
          onChange={(e) => setEditSubject(e.target.value)}
          placeholder="Subject"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 admin-input"
        />
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          rows={6}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-xs text-zinc-200 font-mono admin-input resize-y"
        />
        <div className="flex gap-1.5">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="text-[11px] px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white disabled:opacity-50"
          >
            {isPending ? "..." : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

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
          onClick={handleCheckStatus}
          disabled={isPending}
          className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 disabled:opacity-50"
        >
          Refresh
        </button>
        <button
          onClick={startEdit}
          className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400"
        >
          Edit
        </button>
        {emailState.status === "draft" && (
          <>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 admin-input"
            />
            <button
              onClick={handleSchedule}
              disabled={isPending || !scheduleDate}
              className="text-[11px] px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white disabled:opacity-50"
            >
              Schedule
            </button>
          </>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[11px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-red-400 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
