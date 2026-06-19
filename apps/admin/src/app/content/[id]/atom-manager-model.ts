import type { Platform, VoiceMode } from "@anipotts/types";

export type AtomFeedback = {
  type: "success" | "error";
  message: string;
};

export const PLATFORMS: {
  value: Platform;
  label: string;
  maxChars: number;
}[] = [
  { value: "twitter", label: "X / Twitter", maxChars: 280 },
  { value: "linkedin", label: "LinkedIn", maxChars: 3000 },
  { value: "threads", label: "Threads", maxChars: 500 },
  { value: "instagram", label: "Instagram", maxChars: 2200 },
  { value: "tiktok", label: "TikTok", maxChars: 2200 },
  { value: "bluesky", label: "Bluesky", maxChars: 300 },
  { value: "mastodon", label: "Mastodon", maxChars: 500 },
];

export const VOICE_OPTIONS: { value: VoiceMode; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "spicy", label: "Spicy" },
  { value: "professional", label: "Professional" },
];

export function parseHashtagInput(input: string) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatHashtag(tag: string) {
  return tag.startsWith("#") ? tag : `#${tag}`;
}
