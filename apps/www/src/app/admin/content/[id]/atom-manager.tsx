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
import { PLATFORM_COLORS, ATOM_STATUS_COLORS } from "@/lib/constants";

const PLATFORMS: { value: Platform; label: string; maxChars: number }[] = [
  { value: "twitter", label: "X / Twitter", maxChars: 280 },
  { value: "linkedin", label: "LinkedIn", maxChars: 3000 },
  { value: "threads", label: "Threads", maxChars: 500 },
  { value: "instagram", label: "Instagram", maxChars: 2200 },
  { value: "tiktok", label: "TikTok", maxChars: 2200 },
  { value: "bluesky", label: "Bluesky", maxChars: 300 },
  { value: "mastodon", label: "Mastodon", maxChars: 500 },
];

const VOICE_OPTIONS: { value: VoiceMode; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "spicy", label: "Spicy" },
  { value: "professional", label: "Professional" },
];

export default function AtomManager({
  contentId,
  atoms,
}: {
  contentId: string;
  atoms: Atom[];
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editHashtags, setEditHashtags] = useState("");
  const router = useRouter();

  // Create form state
  const [newPlatform, setNewPlatform] = useState<Platform>("twitter");
  const [newContent, setNewContent] = useState("");
  const [newVoice, setNewVoice] = useState<VoiceMode>("casual");
  const [newHashtags, setNewHashtags] = useState("");

  const selectedPlatform = PLATFORMS.find((p) => p.value === newPlatform);

  function handleCreate() {
    startTransition(async () => {
      setFeedback(null);
      const tags = newHashtags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const result = await createAtom(
        contentId,
        newPlatform,
        newContent,
        newVoice,
        tags,
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
      const tags = editHashtags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const result = await updateAtom(atomId, {
        atom_content: editContent,
        hashtags: tags,
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
        <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-700">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 block mb-1">
                Platform
              </label>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as Platform)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} ({p.maxChars} chars)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Voice</label>
              <select
                value={newVoice}
                onChange={(e) => setNewVoice(e.target.value as VoiceMode)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-zinc-500">Content</label>
              <span
                className={`text-xs ${
                  newContent.length > (selectedPlatform?.maxChars || 280)
                    ? "text-red-400"
                    : "text-zinc-600"
                }`}
              >
                {newContent.length}/{selectedPlatform?.maxChars || 280}
              </span>
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={5}
              placeholder={`Write your ${selectedPlatform?.label || "X"} post...`}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono admin-input resize-y"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-1">
              Hashtags (comma separated)
            </label>
            <input
              type="text"
              value={newHashtags}
              onChange={(e) => setNewHashtags(e.target.value)}
              placeholder="#claudecode, #ai"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={isPending || !newContent.trim()}
            className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {isPending ? "Creating..." : "Create Atom"}
          </button>
        </div>
      )}

      {atoms.length === 0 && !showCreate && (
        <p className="text-zinc-600 text-sm">
          No atoms yet. Create one to start distributing.
        </p>
      )}

      {atoms.map((atom) => (
        <div key={atom.id} className="bg-zinc-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[atom.platform] || "bg-zinc-700 text-zinc-300"}`}
            >
              {atom.platform}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${ATOM_STATUS_COLORS[atom.status] || ATOM_STATUS_COLORS.draft}`}
            >
              {atom.status}
            </span>
            {atom.voice_mode && (
              <span className="text-xs text-zinc-500">{atom.voice_mode}</span>
            )}
            {atom.typefully_draft_id && (
              <span className="text-xs text-indigo-400">Typefully linked</span>
            )}
          </div>

          {editingId === atom.id ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono admin-input resize-y"
              />
              <input
                type="text"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="Hashtags (comma separated)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(atom.id)}
                  disabled={isPending}
                  className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {atom.atom_content}
            </p>
          )}

          {atom.hashtags &&
            atom.hashtags.length > 0 &&
            editingId !== atom.id && (
              <div className="flex flex-wrap gap-1">
                {atom.hashtags.map((tag) => (
                  <span key={tag} className="text-xs text-indigo-400">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            )}

          {editingId !== atom.id && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => startEdit(atom)}
                className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
              >
                Edit
              </button>
              {!atom.typefully_draft_id ? (
                <button
                  onClick={() => handlePushToTypefully(atom.id)}
                  disabled={isPending}
                  className="text-xs px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500/80 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  {isPending ? "..." : "Push to Typefully"}
                </button>
              ) : (
                <button
                  onClick={() => handleCheckTypefully(atom.typefully_draft_id!)}
                  disabled={isPending}
                  className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-indigo-400 transition-colors disabled:opacity-50"
                >
                  {isPending ? "..." : "Check Status"}
                </button>
              )}
              <button
                onClick={() => handleDelete(atom.id)}
                disabled={isPending}
                className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-red-400 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
