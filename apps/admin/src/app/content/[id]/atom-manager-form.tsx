"use client";

import type { Platform, VoiceMode } from "@anipotts/types";
import { PLATFORMS, VOICE_OPTIONS } from "./atom-manager-model";

export function AtomCreateForm({
  platform,
  content,
  voice,
  hashtags,
  isPending,
  onPlatformChange,
  onContentChange,
  onVoiceChange,
  onHashtagsChange,
  onSubmit,
}: {
  platform: Platform;
  content: string;
  voice: VoiceMode;
  hashtags: string;
  isPending: boolean;
  onPlatformChange: (platform: Platform) => void;
  onContentChange: (content: string) => void;
  onVoiceChange: (voice: VoiceMode) => void;
  onHashtagsChange: (hashtags: string) => void;
  onSubmit: () => void;
}) {
  const selectedPlatform = PLATFORMS.find((entry) => entry.value === platform);
  const maxChars = selectedPlatform?.maxChars ?? 280;

  return (
    <div className="bg-zinc-900 rounded-xl p-4 space-y-3 border border-zinc-700">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">Platform</label>
          <select
            value={platform}
            onChange={(event) =>
              onPlatformChange(event.target.value as Platform)
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
          >
            {PLATFORMS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label} ({entry.maxChars} chars)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Voice</label>
          <select
            value={voice}
            onChange={(event) => onVoiceChange(event.target.value as VoiceMode)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
          >
            {VOICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-zinc-500">Content</label>
          <span
            className={`text-xs ${content.length > maxChars ? "text-red-400" : "text-zinc-600"}`}
          >
            {content.length}/{maxChars}
          </span>
        </div>
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
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
          value={hashtags}
          onChange={(event) => onHashtagsChange(event.target.value)}
          placeholder="#claudecode, #ai"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 admin-input"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={isPending || !content.trim()}
        className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
      >
        {isPending ? "Creating..." : "Create Atom"}
      </button>
    </div>
  );
}
