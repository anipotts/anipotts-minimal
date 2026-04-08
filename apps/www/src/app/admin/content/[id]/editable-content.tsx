"use client";

import {
  useState,
  useTransition,
  useCallback,
  type KeyboardEvent,
} from "react";
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
  const [editTags, setEditTags] = useState<string[]>(tags);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const router = useRouter();

  const markDirty = useCallback(() => {
    if (!dirty) setDirty(true);
    setFeedback(null);
  }, [dirty]);

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^,|,$/g, "");
      if (tag && !editTags.includes(tag)) {
        setEditTags([...editTags, tag]);
        markDirty();
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && editTags.length > 0) {
      setEditTags(editTags.slice(0, -1));
      markDirty();
    }
  }

  function removeTag(tag: string) {
    setEditTags(editTags.filter((t) => t !== tag));
    markDirty();
  }

  function handleSave() {
    startTransition(async () => {
      setFeedback(null);
      const result = await updateThoughtContent(id, {
        title: editTitle,
        summary: editSummary,
        content: editContent,
        tags: editTags,
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
    <div className="space-y-3 h-full flex flex-col">
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
        className="w-full text-xl font-semibold text-zinc-100 admin-field px-4 py-2"
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
        className="w-full text-sm text-zinc-300 admin-field px-4 py-2 resize-none"
      />

      {/* Tags */}
      <div
        className="admin-field px-3 py-2 flex flex-wrap items-center gap-1.5 min-h-[2.25rem] cursor-text"
        onClick={(e) => {
          const input = (e.currentTarget as HTMLElement).querySelector("input");
          input?.focus();
        }}
      >
        {editTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              x
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder={editTags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[80px] bg-transparent text-xs text-zinc-400 outline-none placeholder:text-zinc-600"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {showPreview ? (
          <div className="h-full overflow-y-auto bg-zinc-900/50 rounded-lg p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
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
            className="w-full h-full p-4 text-sm text-zinc-200 font-mono admin-editor resize-none leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}
