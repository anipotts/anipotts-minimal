"use client";

import { useState } from "react";
import { FaCircle, FaChevronDown, FaChevronRight } from "react-icons/fa";

// Series definitions from content-config/config/signature-series.yaml
const SERIES_CONFIG = {
  "60s-fix": {
    name: "60s Fix",
    description: "Quick Claude Code / AI tool tip. One problem, one solution, under 60 seconds.",
    frequency: "2x/week",
    format: "short-video",
    voice_mode: "spicy",
    duration: "30-60 seconds",
    artifact_required: true,
    artifact_type: "gist",
    platforms: {
      primary: ["tiktok", "instagram", "twitter"],
      secondary: ["threads", "bluesky", "linkedin", "youtube"],
      skip: ["medium", "devto", "substack", "reddit"],
    },
  },
  "i-tried-it": {
    name: "I Tried It",
    description: "Deep dive building something with AI tools. Show the full process, mistakes included.",
    frequency: "1x/week",
    format: "long-form",
    voice_mode: "casual",
    duration: "3-10 min video or 1000-2000 words",
    artifact_required: true,
    artifact_type: "repo",
    platforms: {
      primary: ["medium", "devto", "youtube", "twitter", "linkedin", "substack"],
      secondary: ["reddit", "tiktok", "instagram"],
      skip: ["threads", "bluesky"],
    },
  },
  "quick-tip": {
    name: "Quick Tip",
    description: "Single-point micro tip. Text-first, no video required.",
    frequency: "1-2x/week (gap filler)",
    format: "text",
    voice_mode: "casual",
    artifact_required: false,
    artifact_type: "gist",
    platforms: {
      primary: ["twitter", "threads", "bluesky"],
      secondary: ["linkedin"],
      skip: ["video platforms", "long-form"],
    },
  },
  "stack-update": {
    name: "Stack / Tool Update",
    description: "New feature, tool update, or stack change worth sharing.",
    frequency: "as-needed (gap filler)",
    format: "text-or-short-video",
    voice_mode: "casual",
    artifact_required: false,
    artifact_type: "gist",
    platforms: {
      primary: ["twitter", "linkedin"],
      secondary: ["bluesky", "threads", "devto"],
      skip: ["video platforms", "substack", "reddit"],
    },
  },
  "viral-reel": {
    name: "Viral Format Reel",
    description: "Proven 100k-300k+ view format: face close to camera, 'claude code tip', screen recording proof.",
    frequency: "1-2x/week (gap filler)",
    format: "short-video",
    voice_mode: "spicy",
    duration: "15-30 seconds",
    artifact_required: true,
    artifact_type: "gist",
    platforms: {
      primary: ["tiktok", "instagram"],
      secondary: ["youtube", "twitter"],
      skip: ["long-form", "text-only"],
    },
  },
};

// Voice modes from content-config/voice/tone-guide.md
const VOICE_MODES = {
  spicy: {
    name: "Spicy",
    platforms: ["Twitter", "TikTok"],
    description: "Maximum personality. Abbreviations: yk, ngl, tbh, lowkey, highkey. Hot takes, provocative hooks.",
    sounds_like: "Texting your tech friend about something wild you just found",
    abbreviations: "High (yk, ngl, tbh, u, ur)",
  },
  casual: {
    name: "Casual",
    platforms: ["Threads", "Instagram", "Bluesky", "YouTube", "Substack"],
    description: "Conversational, friendly. Some abbreviations. Relatable, approachable.",
    sounds_like: "Explaining to a curious friend at a coffee shop",
    abbreviations: "Medium (occasional ngl, tbh)",
  },
  professional: {
    name: "Professional",
    platforms: ["LinkedIn", "Medium", "Dev.to"],
    description: "Polished but not corporate. Full words, clear structure. Still sounds like a person.",
    sounds_like: "Presenting at a meetup, not a board meeting",
    abbreviations: "None",
  },
};

// Anti-corny guardrails
const ANTI_CORNY = [
  { rule: "No fake vulnerability", desc: "Don't perform honesty. Just be honest." },
  { rule: "No engagement farming", desc: 'No "comment X if you agree." Let content earn engagement.' },
  { rule: "No guru energy", desc: "Share what you found, don't tell people what to do." },
  { rule: "No hype without receipts", desc: "Every claim needs a proof artifact." },
  { rule: "No recycled platitudes", desc: "If it could go on a motivational poster, delete it." },
];

type SeriesKey = keyof typeof SERIES_CONFIG;

export default function ConfigTab() {
  const [expandedSeries, setExpandedSeries] = useState<SeriesKey | null>("60s-fix");
  const [expandedVoice, setExpandedVoice] = useState<string | null>("spicy");

  return (
    <div className="h-full p-3 flex flex-col gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <FaCircle className="w-2 h-2 text-accent-400" />
        <h2 className="text-sm font-mono uppercase tracking-wide text-[var(--text-primary)] font-semibold">
          Content Configuration
        </h2>
        <span className="text-xs text-[var(--text-muted)] font-medium">
          from content-config/
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Series Definitions */}
        <div className="bg-[var(--overlay-3)] border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--overlay-5)]">
            <h3 className="text-xs font-mono uppercase tracking-wide text-[var(--text-secondary)] font-semibold">
              Signature Series
            </h3>
          </div>
          <div className="divide-y divide-border">
            {(Object.keys(SERIES_CONFIG) as SeriesKey[]).map((key) => {
              const series = SERIES_CONFIG[key];
              const isExpanded = expandedSeries === key;
              return (
                <div key={key}>
                  <button
                    onClick={() => setExpandedSeries(isExpanded ? null : key)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-input/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <FaChevronDown className="w-3 h-3 text-accent-400" />
                      ) : (
                        <FaChevronRight className="w-3 h-3 text-muted" />
                      )}
                      <span className="text-xs font-bold text-secondary">{series.name}</span>
                      <span className="text-[10px] text-faint">{series.frequency}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      series.artifact_required
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}>
                      {series.artifact_type}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-input/30 space-y-3">
                      <p className="text-xs text-muted">{series.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-faint">Format:</span>
                          <span className="text-secondary ml-1">{series.format}</span>
                        </div>
                        <div>
                          <span className="text-faint">Voice:</span>
                          <span className="text-secondary ml-1">{series.voice_mode}</span>
                        </div>
                        {"duration" in series && series.duration && (
                          <div className="col-span-2">
                            <span className="text-faint">Duration:</span>
                            <span className="text-secondary ml-1">{series.duration}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px]">
                          <span className="text-green-400">Primary:</span>
                          <span className="text-muted ml-1">{series.platforms.primary.join(", ")}</span>
                        </div>
                        <div className="text-[10px]">
                          <span className="text-blue-400">Secondary:</span>
                          <span className="text-muted ml-1">{series.platforms.secondary.join(", ")}</span>
                        </div>
                        <div className="text-[10px]">
                          <span className="text-red-400">Skip:</span>
                          <span className="text-muted ml-1">{series.platforms.skip.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Modes + Anti-Corny */}
        <div className="space-y-6">
          {/* Voice Modes */}
          <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-[rgba(var(--overlay-invert),0.2)]">
              <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary">
                Voice Modes
              </h3>
            </div>
            <div className="divide-y divide-border">
              {Object.entries(VOICE_MODES).map(([key, mode]) => {
                const isExpanded = expandedVoice === key;
                return (
                  <div key={key}>
                    <button
                      onClick={() => setExpandedVoice(isExpanded ? null : key)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-input/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <FaChevronDown className="w-3 h-3 text-accent-400" />
                        ) : (
                          <FaChevronRight className="w-3 h-3 text-muted" />
                        )}
                        <span className="text-xs font-bold text-secondary">{mode.name}</span>
                      </div>
                      <span className="text-[10px] text-faint">
                        {mode.platforms.join(", ")}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 bg-input/30 space-y-2">
                        <p className="text-xs text-muted">{mode.description}</p>
                        <div className="text-[10px]">
                          <span className="text-faint">Sounds like:</span>
                          <span className="text-secondary ml-1 italic">"{mode.sounds_like}"</span>
                        </div>
                        <div className="text-[10px]">
                          <span className="text-faint">Abbreviations:</span>
                          <span className="text-secondary ml-1">{mode.abbreviations}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anti-Corny Guardrails */}
          <div className="bg-[rgba(var(--overlay-invert),0.4)] border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-[rgba(var(--overlay-invert),0.2)]">
              <h3 className="text-xs font-mono uppercase tracking-widest text-tertiary">
                Anti-Corny Guardrails
              </h3>
              <p className="text-[10px] text-red-400 mt-1">Non-negotiable</p>
            </div>
            <div className="p-4 space-y-3">
              {ANTI_CORNY.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-red-400 text-xs mt-0.5">✕</span>
                  <div>
                    <span className="text-xs font-bold text-secondary">{item.rule}</span>
                    <p className="text-[10px] text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* File References */}
      <div className="text-[10px] text-faint font-mono">
        Config files: content-config/config/signature-series.yaml • content-config/voice/tone-guide.md • content-config/voice/anti-corny-guardrails.md
      </div>
    </div>
  );
}
