"use client";

import { useEffect, useState } from "react";
import { getAllAtoms, getAdminContent, deleteAtom, upsertAtom } from "../actions";
import type { Atom, Thought, Platform } from "@anipotts/types";
import { FaCircle, FaTrash, FaEdit, FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";

const PLATFORM_COLORS: Record<Platform, string> = {
  twitter: "text-blue-400",
  linkedin: "text-blue-600",
  tiktok: "text-pink-500",
  instagram: "text-purple-500",
  threads: "text-gray-400",
  bluesky: "text-sky-400",
  mastodon: "text-indigo-400",
  youtube: "text-red-500",
  medium: "text-green-600",
  devto: "text-gray-300",
  substack: "text-orange-500",
  reddit: "text-orange-600",
};

const STATUS_BADGES = {
  draft: { label: "Draft", color: "bg-yellow-500/20 text-yellow-400" },
  scheduled: { label: "Scheduled", color: "bg-blue-500/20 text-blue-400" },
  posted: { label: "Posted", color: "bg-green-500/20 text-green-400" },
};

export default function AtomsTab() {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [content, setContent] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Platform | "draft" | "scheduled" | "posted">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [atomsData, contentData] = await Promise.all([
          getAllAtoms(),
          getAdminContent(),
        ]);
        setAtoms(atomsData || []);
        setContent(contentData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const getContentTitle = (contentId: string): string => {
    const item = content.find((c) => c.id === contentId);
    return item?.title || "Unknown";
  };

  const filteredAtoms = atoms.filter((atom) => {
    if (filter === "all") return true;
    if (filter === "draft" || filter === "scheduled" || filter === "posted") {
      return atom.status === filter;
    }
    return atom.platform === filter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this atom?")) return;
    try {
      await deleteAtom(id);
      setAtoms(atoms.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting atom:", err);
    }
  };

  const handleSaveEdit = async (atom: Atom) => {
    try {
      const updated = await upsertAtom({ ...atom, atom_content: editContent });
      setAtoms(atoms.map((a) => (a.id === atom.id ? { ...a, atom_content: editContent } : a)));
      setEditingId(null);
    } catch (err) {
      console.error("Error saving atom:", err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)] animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full p-3 flex flex-col gap-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1">
        <div className="flex items-center gap-2">
          <FaCircle className="w-2 h-2 text-accent-400" />
          <h2 className="text-sm font-mono uppercase tracking-wide text-[var(--text-primary)] font-semibold">
            Generated Atoms
          </h2>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {atoms.length} total
          </span>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-tertiary)] uppercase font-medium">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:border-[var(--accent-400)] focus:outline-none"
          >
            <option value="all">All Platforms</option>
            <optgroup label="By Status">
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="posted">Posted</option>
            </optgroup>
            <optgroup label="By Platform">
              {Object.keys(PLATFORM_COLORS).map((platform) => (
                <option key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Atoms List - scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {filteredAtoms.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            No atoms found. Use <code className="bg-[var(--input-bg)] px-1.5 py-0.5 rounded font-mono text-[var(--accent-400)]">/atomize</code> to generate atoms from content.
          </div>
        ) : (
          filteredAtoms.map((atom) => (
            <div
              key={atom.id}
              className="bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent-400)]/30 transition-colors"
            >
              {/* Atom Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${PLATFORM_COLORS[atom.platform]}`}>
                    {atom.platform.toUpperCase()}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_BADGES[atom.status]?.color || STATUS_BADGES.draft.color}`}>
                    {STATUS_BADGES[atom.status]?.label || "Draft"}
                  </span>
                  {atom.voice_mode && (
                    <span className="text-[10px] text-faint">
                      {atom.voice_mode} voice
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {atom.external_url && (
                    <a
                      href={atom.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-400 hover:text-accent-300"
                    >
                      <FaExternalLinkAlt />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setEditingId(atom.id);
                      setEditContent(atom.atom_content);
                    }}
                    className="text-xs text-muted hover:text-secondary"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(atom.id)}
                    className="text-xs text-muted hover:text-red-400"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Source Content */}
              <div className="text-[10px] text-faint mb-2">
                From: <span className="text-muted">{getContentTitle(atom.content_id)}</span>
              </div>

              {/* Atom Content */}
              {editingId === atom.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-input border border-border rounded p-2 text-xs text-secondary font-mono min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(atom)}
                      className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-1"
                    >
                      <FaCheck /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center gap-1"
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-tertiary whitespace-pre-wrap bg-input/50 rounded p-3 max-h-[150px] overflow-y-auto">
                  {atom.atom_content}
                </div>
              )}

              {/* Hashtags */}
              {atom.hashtags && atom.hashtags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {atom.hashtags.map((tag, i) => (
                    <span key={i} className="text-[10px] text-accent-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 text-[10px] text-faint">
                <span>
                  Created {new Date(atom.created_at).toLocaleDateString()}
                </span>
                {atom.scheduled_at && (
                  <span className="text-blue-400">
                    Scheduled: {new Date(atom.scheduled_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
