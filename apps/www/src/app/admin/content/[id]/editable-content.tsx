"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateThoughtContent } from "../../actions";

export default function EditableContent({
  id,
  title,
  summary,
  content,
  tags,
}: {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
}) {
  const [editTitle, setEditTitle] = useState(title);
  const [editSummary, setEditSummary] = useState(summary);
  const [editContent, setEditContent] = useState(content);
  const [editTags, setEditTags] = useState(tags.join(", "));
  const [showPreview, setShowPreview] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  const markDirty = useCallback(() => {
    if (!dirty) setDirty(true);
    setFeedback(null);
  }, [dirty]);

  function handleSave() {
    startTransition(async () => {
      setFeedback(null);
      const result = await updateThoughtContent(id, {
        title: editTitle,
        summary: editSummary,
        content: editContent,
        tags: editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      if ("error" in result) {
        setFeedback(`Error: ${result.error}`);
      } else {
        setFeedback("Saved");
        setDirty(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Save bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {feedback && (
            <span
              className={`text-xs ${feedback.startsWith("Error") ? "text-red-400" : "text-green-400"}`}
            >
              {feedback}
            </span>
          )}
          {dirty && !feedback && (
            <span className="text-xs text-zinc-500">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">
            {editContent.length.toLocaleString()} chars
          </span>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              showPreview
                ? "bg-indigo-600/20 text-indigo-400"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !dirty}
            className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-md text-white transition-colors"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={editTitle}
        onChange={(e) => {
          setEditTitle(e.target.value);
          markDirty();
        }}
        placeholder="Title"
        className="w-full bg-transparent text-xl font-semibold text-zinc-100 admin-field pb-1"
      />

      {/* Summary */}
      <textarea
        value={editSummary}
        onChange={(e) => {
          setEditSummary(e.target.value);
          markDirty();
        }}
        placeholder="Summary (one line description)"
        rows={2}
        className="w-full bg-transparent text-sm text-zinc-300 admin-field pb-1 resize-none"
      />

      {/* Tags */}
      <input
        type="text"
        value={editTags}
        onChange={(e) => {
          setEditTags(e.target.value);
          markDirty();
        }}
        placeholder="Tags (comma separated)"
        className="w-full bg-transparent text-xs text-zinc-400 admin-field pb-1"
      />

      {/* Content */}
      <div className="flex-1 min-h-0">
        {showPreview ? (
          <div className="h-full overflow-y-auto bg-zinc-900/50 rounded-md p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {editContent || "Nothing to preview"}
          </div>
        ) : (
          <textarea
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              markDirty();
            }}
            placeholder="Start writing..."
            className="w-full h-full bg-zinc-900/30 p-4 text-sm text-zinc-200 font-mono admin-editor resize-none leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}
