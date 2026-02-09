"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FaCheck,
  FaCircle,
  FaPlus,
  FaSearch,
  FaSave,
  FaTrash,
  FaClock,
} from "react-icons/fa";
import {
  getAdminContent,
  upsertContent,
  deleteContent,
  searchContent,
  scheduleContent,
} from "../actions";
import MarkdownEditor from "@/components/MarkdownEditor";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Thought, ContentType, SeriesType, ContentStatus, VoiceMode, Platform } from "@anipotts/types";

type EditableContent = Partial<Thought> &
  Pick<Thought, "title" | "slug" | "content" | "published" | "tags">;

export default function ContentTab() {
  const posthog = usePostHog();
  const [contents, setContents] = useState<Thought[]>([]);
  const [editing, setEditing] = useState<EditableContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { type: string; id: string; slug: string; title: string; summary: string; rank: number }[] | null
  >(null);
  const [searching, setSearching] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchContent = async () => {
    try {
      const data = await getAdminContent();
      if (data) setContents(data as Thought[]);
    } catch (err) {
      console.error("Error fetching content:", err);
    }
  };

  const handleSave = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!editing) return;

      setLoading(true);
      try {
        const savedContent = (await upsertContent(editing)) as Thought;

        if (typeof posthog?.capture === "function") {
          posthog.capture("content_saved", {
            content_title: editing.title,
            content_slug: editing.slug,
            is_new: !editing.id,
            is_published: editing.published,
            content_type: editing.content_type,
            status: editing.status,
          });
        }

        // Update local list with saved data
        setContents((prev) => {
          const exists = prev.find((t) => t.id === savedContent.id);
          if (exists)
            return prev.map((t) =>
              t.id === savedContent.id ? savedContent : t
            );
          return [savedContent, ...prev];
        });

        setEditing(savedContent);
        setUnsavedChanges(false);
      } catch (err) {
        if (typeof posthog?.captureException === "function") {
          posthog.captureException(err);
        }
        alert("Error saving");
        console.error(err);
      }
      setLoading(false);
    },
    [editing]
  );

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    if (!editing) return;
    setUnsavedChanges(true);
  }, [editing]);

  // Real-time subscription: refresh list when thoughts table changes
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("admin_thoughts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "thoughts" },
        () => {
          // Only refresh the list, not the currently-editing item
          fetchContent();
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, []);

  // Debounced full-text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchContent(searchQuery.trim());
        setSearchResults(results);
      } catch {
        setSearchResults(null);
      }
      setSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editing) handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, handleSave]);

  const handleDelete = async () => {
    if (!editing || !editing.id) return;
    if (!confirm("Delete this content? This cannot be undone.")) return;

    try {
      await deleteContent(editing.id);
      if (typeof posthog?.capture === "function") {
        posthog.capture("content_deleted", { content_id: editing.id });
      }

      setContents((prev) => prev.filter((t) => t.id !== editing.id));
      setEditing(null);
    } catch (err) {
      alert("Error deleting");
    }
  };

  const startNew = () => {
    const newContent = {
      title: "",
      slug: "",
      summary: "",
      content: "",
      tags: [],
      published: false,
      status: "draft" as ContentStatus,
    };
    setEditing(newContent);
    setUnsavedChanges(false);
  };

  const handleScheduleChange = async (dateValue: string) => {
    if (!editing?.id) return;
    const scheduledAt = dateValue ? new Date(dateValue).toISOString() : null;
    try {
      await scheduleContent(editing.id, scheduledAt);
      setEditing({ ...editing, scheduled_at: scheduledAt ?? undefined });
      setContents((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? { ...t, scheduled_at: scheduledAt ?? undefined }
            : t
        )
      );
    } catch (err) {
      console.error("Error scheduling:", err);
    }
  };

  // Client-side filter when no search query; use search results when searching
  const filteredContents = searchQuery.trim() && searchResults
    ? searchResults
        .filter((r) => r.type === "thought")
        .map((r) => contents.find((c) => c.id === r.id))
        .filter(Boolean) as Thought[]
    : contents.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Format a date string to local datetime-local input value
  const toDatetimeLocalValue = (isoStr?: string): string => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const showScheduler =
    editing && (editing.status === "draft" || editing.status === "ready");

  return (
    <div className="flex h-full border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--input-bg)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-[var(--card-darker)]">
        <div className="p-4 border-b border-border flex flex-col gap-3">
          <button
            onClick={startNew}
            className="w-full bg-accent-400/10 hover:bg-accent-400/20 text-accent-400 border border-accent-400/20 py-2.5 rounded text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <FaPlus /> New Content
          </button>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-xs" />
            <input
              className="w-full bg-[var(--input-bg)] border border-border rounded py-2.5 pl-8 pr-3 text-xs text-secondary focus:border-accent-400/50 focus:outline-none"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-faint animate-pulse">
                ...
              </span>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {filteredContents.map((content) => (
            <div
              key={content.id}
              onClick={() => setEditing(content)}
              className={`px-4 py-3 border-b border-border-subtle cursor-pointer hover:bg-input transition-colors ${
                editing?.id === content.id
                  ? "bg-overlay-10 border-l-2 border-l-accent-400"
                  : "border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4
                  className={`text-sm font-medium truncate pr-2 ${
                    editing?.id === content.id
                      ? "text-body"
                      : "text-tertiary"
                  }`}
                >
                  {content.title || "Untitled"}
                </h4>
                {content.published && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                )}
              </div>
              <div className="flex justify-between items-center text-[11px] text-faint font-mono">
                <span className="truncate max-w-[100px]">{content.slug}</span>
                <span>
                  {new Date(content.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {content.status && (
                <span className={`text-[11px] font-semibold mt-1.5 inline-block px-2.5 py-1 rounded ${
                  content.status === "idea" ? "bg-blue-500/15 text-blue-400" :
                  content.status === "draft" ? "bg-yellow-500/15 text-yellow-300" :
                  content.status === "ready" ? "bg-orange-500/15 text-orange-400" :
                  content.status === "atomized" ? "bg-purple-500/15 text-purple-400" :
                  "bg-green-500/15 text-green-400"
                }`}>
                  {content.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-grow flex flex-col bg-card-darker">
        {editing ? (
          <>
            {/* Editor Header */}
            <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-input">
              <div className="flex items-center gap-4 flex-grow">
                <div className="flex flex-col w-full">
                  <input
                    className="bg-transparent text-lg font-semibold text-body focus:outline-none w-full placeholder-faint"
                    placeholder="Content Title"
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        title: e.target.value,
                        slug: !editing.id
                          ? e.target.value
                              .toLowerCase()
                              .replace(/ /g, "-")
                              .replace(/[^\w-]+/g, "")
                          : editing.slug,
                      })
                    }
                  />
                  <input
                    className="bg-transparent text-[13px] text-tertiary focus:outline-none w-full placeholder-faint mt-1 font-mono"
                    placeholder="Summary"
                    value={editing.summary || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, summary: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 mr-4">
                  <span
                    className={`text-[11px] uppercase tracking-wider ${
                      unsavedChanges ? "text-yellow-500" : "text-faint"
                    }`}
                  >
                    {unsavedChanges ? "Unsaved" : "Saved"}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete()}
                  className="p-2 text-muted hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={(e) => handleSave(e)}
                  disabled={loading}
                  className="bg-overlay-10 hover:bg-overlay-20 text-body px-4 py-2.5 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <FaSave /> {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="px-6 py-3 border-b border-border flex gap-4 items-center bg-[var(--card-darker)] flex-wrap">
              <div className="flex items-center gap-2 min-w-[150px]">
                <span className="text-[11px] text-muted uppercase tracking-wide font-mono">
                  Slug:
                </span>
                <input
                  className="bg-transparent text-xs text-accent-400 font-mono focus:outline-none flex-grow"
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing({ ...editing, slug: e.target.value })
                  }
                  placeholder="url-slug"
                />
              </div>

              <div className="w-px h-4 bg-border" />

              {/* Status Select */}
              <select
                className="bg-input border border-border text-xs text-secondary font-mono rounded px-3 py-2.5 focus:border-accent-400/50 focus:outline-none"
                value={editing.status || "draft"}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as ContentStatus,
                  })
                }
              >
                <option value="idea">Idea</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="atomized">Atomized</option>
              </select>

              {/* Schedule date-time picker (only for draft/ready) */}
              {showScheduler && (
                <>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-2">
                    <FaClock className="w-3 h-3 text-blue-400" />
                    <span className="text-[11px] text-muted uppercase tracking-wide font-mono">
                      Schedule:
                    </span>
                    <input
                      type="datetime-local"
                      className="bg-input border border-border text-xs text-secondary font-mono rounded px-3 py-2.5 focus:border-accent-400/50 focus:outline-none"
                      value={toDatetimeLocalValue((editing as Thought).scheduled_at)}
                      onChange={(e) => handleScheduleChange(e.target.value)}
                    />
                    {(editing as Thought).scheduled_at && (
                      <button
                        onClick={() => handleScheduleChange("")}
                        className="text-[11px] text-red-400 hover:text-red-300 font-mono"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </>
              )}

              <div className="w-px h-4 bg-border" />

              {/* Tags Input */}
              <div className="flex items-center gap-2 flex-grow">
                <span className="text-[11px] text-muted uppercase tracking-wide font-mono">
                  Tags:
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  {(Array.isArray(editing.tags) ? editing.tags : []).map(
                    (tag: string) => (
                      <span
                        key={tag}
                        className="bg-overlay-10 text-secondary px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() =>
                            setEditing({
                              ...editing,
                              tags: editing.tags.filter((t: string) => t !== tag),
                            })
                          }
                          className="hover:text-red-400"
                        >
                          &times;
                        </button>
                      </span>
                    )
                  )}
                  <input
                    className="bg-transparent text-xs text-tertiary font-mono focus:outline-none min-w-[60px]"
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (
                          val &&
                          !editing.tags?.includes(val)
                        ) {
                          setEditing({
                            ...editing,
                            tags: [
                              ...(Array.isArray(editing.tags)
                                ? editing.tags
                                : []),
                              val,
                            ],
                          });
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="w-px h-4 bg-border" />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.published}
                  onChange={(e) =>
                    setEditing({ ...editing, published: e.target.checked })
                  }
                  className="accent-accent-400"
                />
                <span
                  className={`text-[11px] uppercase tracking-wide font-mono ${
                    editing.published ? "text-green-400" : "text-muted"
                  }`}
                >
                  {editing.published ? "Published" : "Draft"}
                </span>
              </label>
            </div>

            {/* Editor Body */}
            <div className="flex-grow overflow-hidden p-4">
              <MarkdownEditor
                value={editing.content || ""}
                onChange={(val) =>
                  setEditing({ ...editing, content: val })
                }
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-faint gap-4">
            <div className="w-16 h-16 rounded-full bg-input flex items-center justify-center text-2xl">
              <FaCircle className="text-faint" />
            </div>
            <p className="font-mono text-[13px] uppercase tracking-wide">
              Select content or create new
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
