"use client";

import type { Atom } from "@anipotts/types";
import { PLATFORM_COLORS, ATOM_STATUS_COLORS } from "@/lib/constants";
import { formatHashtag } from "./atom-manager-model";

export function AtomCard({
  atom,
  isEditing,
  editContent,
  editHashtags,
  isPending,
  onStartEdit,
  onEditContentChange,
  onEditHashtagsChange,
  onUpdate,
  onCancelEdit,
  onPushToTypefully,
  onCheckTypefully,
  onDelete,
}: {
  atom: Atom;
  isEditing: boolean;
  editContent: string;
  editHashtags: string;
  isPending: boolean;
  onStartEdit: () => void;
  onEditContentChange: (content: string) => void;
  onEditHashtagsChange: (hashtags: string) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  onPushToTypefully: () => void;
  onCheckTypefully: (draftId: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
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

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(event) => onEditContentChange(event.target.value)}
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono admin-input resize-y"
          />
          <input
            type="text"
            value={editHashtags}
            onChange={(event) => onEditHashtagsChange(event.target.value)}
            placeholder="Hashtags (comma separated)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
          />
          <div className="flex gap-2">
            <button
              onClick={onUpdate}
              disabled={isPending}
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onCancelEdit}
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

      {atom.hashtags && atom.hashtags.length > 0 && !isEditing && (
        <div className="flex flex-wrap gap-1">
          {atom.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-indigo-400">
              {formatHashtag(tag)}
            </span>
          ))}
        </div>
      )}

      {!isEditing && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onStartEdit}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
          >
            Edit
          </button>
          {!atom.typefully_draft_id ? (
            <button
              onClick={onPushToTypefully}
              disabled={isPending}
              className="text-xs px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500/80 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              {isPending ? "..." : "Push to Typefully"}
            </button>
          ) : (
            <button
              onClick={() =>
                atom.typefully_draft_id &&
                onCheckTypefully(atom.typefully_draft_id)
              }
              disabled={isPending}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-indigo-400 transition-colors disabled:opacity-50"
            >
              {isPending ? "..." : "Check Status"}
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={isPending}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-red-400 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
