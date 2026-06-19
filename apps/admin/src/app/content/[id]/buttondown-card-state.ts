"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  pushToButtondown,
  fetchButtondownEmailStatus,
  editButtondownEmail,
  removeButtondownEmail,
} from "../../actions";
import type {
  ButtondownFeedback,
  ButtondownState,
} from "./buttondown-card-types";

export function useButtondownCard({
  contentId,
  initialEmailId,
}: {
  contentId: string;
  initialEmailId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<ButtondownFeedback>(null);
  const [emailState, setEmailState] = useState<ButtondownState>({
    emailId: initialEmailId,
  });
  const [editing, setEditing] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const router = useRouter();

  function handleCreateDraft() {
    if (!confirm("Create a Buttondown email draft for this content?")) return;
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
      const result = await fetchButtondownEmailStatus(emailState.emailId ?? "");
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
      const result = await editButtondownEmail(emailState.emailId ?? "", {
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
    if (
      !confirm(
        `Schedule this email for ${new Date(scheduleDate).toLocaleString()}?`,
      )
    )
      return;
    startTransition(async () => {
      setFeedback(null);
      const result = await editButtondownEmail(emailState.emailId ?? "", {
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
      const result = await removeButtondownEmail(emailState.emailId ?? "");
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

  return {
    isPending,
    feedback,
    emailState,
    editing,
    editSubject,
    editBody,
    scheduleDate,
    setEditSubject,
    setEditBody,
    setScheduleDate,
    setEditing,
    handleCreateDraft,
    handleCheckStatus,
    startEdit,
    handleSave,
    handleSchedule,
    handleDelete,
  };
}
