"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAtom,
  updateAtom,
  deleteAtom,
  pushAtomToTypefully,
  fetchTypefullyDraftStatus,
} from "../../actions";
import type { Atom, Platform, VoiceMode } from "@anipotts/types";
import { AtomCard } from "./atom-manager-card";
import { AtomCreateForm } from "./atom-manager-form";
import { parseHashtagInput, type AtomFeedback } from "./atom-manager-model";

export default function AtomManager({
  contentId,
  atoms,
}: {
  contentId: string;
  atoms: Atom[];
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<AtomFeedback | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const router = useRouter();

  const [newPlatform, setNewPlatform] = useState<Platform>("twitter");
  const [newContent, setNewContent] = useState("");
  const [newVoice, setNewVoice] = useState<VoiceMode>("casual");
  const [newHashtags, setNewHashtags] = useState("");

  function handleCreate() {
    startTransition(async () => {
      setFeedback(null);
      const result = await createAtom(
        contentId,
        newPlatform,
        newContent,
        newVoice,
        parseHashtagInput(newHashtags),
      );
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({ type: "success", message: "Atom created" });
        setNewContent("");
        setNewHashtags("");
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  function handleUpdate(atomId: string) {
    startTransition(async () => {
      setFeedback(null);
      const result = await updateAtom(atomId, {
        atom_content: editContent,
        hashtags: parseHashtagInput(editHashtags),
      });
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({ type: "success", message: "Atom updated" });
        setEditingId(null);
        router.refresh();
      }
    });
  }

  function handleDelete(atomId: string) {
    if (!confirm("Delete this atom?")) return;
    startTransition(async () => {
      setFeedback(null);
      const result = await deleteAtom(atomId);
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({ type: "success", message: "Atom deleted" });
        router.refresh();
      }
    });
  }

  function handlePushToTypefully(atomId: string) {
    if (!confirm("Push this atom to Typefully as a draft?")) return;
    startTransition(async () => {
      setFeedback(null);
      const result = await pushAtomToTypefully(atomId);
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Pushed to Typefully (draft ${result.draftId})`,
        });
        router.refresh();
      }
    });
  }

  function handleCheckTypefully(draftId: string) {
    startTransition(async () => {
      setFeedback(null);
      const result = await fetchTypefullyDraftStatus(draftId);
      if ("error" in result) {
        setFeedback({
          type: "error",
          message: result.error ?? "Unknown error",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Typefully: ${result.draft?.status || "unknown"}`,
        });
      }
    });
  }

  function startEdit(atom: Atom) {
    setEditingId(atom.id);
    setEditContent(atom.atom_content);
    setEditHashtags((atom.hashtags || []).join(", "));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">
          Atoms ({atoms.length})
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
        >
          {showCreate ? "Cancel" : "New Atom"}
        </button>
      </div>

      {feedback && (
        <p
          className={`text-sm ${feedback.type === "error" ? "text-red-400" : "text-green-400"}`}
        >
          {feedback.message}
        </p>
      )}

      {showCreate && (
        <AtomCreateForm
          platform={newPlatform}
          content={newContent}
          voice={newVoice}
          hashtags={newHashtags}
          isPending={isPending}
          onPlatformChange={setNewPlatform}
          onContentChange={setNewContent}
          onVoiceChange={setNewVoice}
          onHashtagsChange={setNewHashtags}
          onSubmit={handleCreate}
        />
      )}

      {atoms.length === 0 && !showCreate && (
        <p className="text-zinc-600 text-sm">
          No atoms yet. Create one to start distributing.
        </p>
      )}

      {atoms.map((atom) => (
        <AtomCard
          key={atom.id}
          atom={atom}
          isEditing={editingId === atom.id}
          editContent={editContent}
          editHashtags={editHashtags}
          isPending={isPending}
          onStartEdit={() => startEdit(atom)}
          onEditContentChange={setEditContent}
          onEditHashtagsChange={setEditHashtags}
          onUpdate={() => handleUpdate(atom.id)}
          onCancelEdit={() => setEditingId(null)}
          onPushToTypefully={() => handlePushToTypefully(atom.id)}
          onCheckTypefully={handleCheckTypefully}
          onDelete={() => handleDelete(atom.id)}
        />
      ))}
    </div>
  );
}
