import { deleteAtomRecord, upsertAtomRecord } from "@anipotts/lib/admin";
import { getDB, now } from "@anipotts/lib/db";
import type { Platform, VoiceMode } from "@anipotts/types";

type AtomUpdateFields = {
  atom_content?: string;
  voice_mode?: VoiceMode;
  hashtags?: string[];
  status?: "draft" | "scheduled" | "posted";
};

export async function createAtomDraft(
  contentId: string,
  platform: Platform,
  atomContent: string,
  voiceMode?: VoiceMode,
  hashtags?: string[],
) {
  if (!getDB()) return { error: "Database not configured" };

  try {
    const data = await upsertAtomRecord({
      content_id: contentId,
      platform,
      atom_content: atomContent,
      voice_mode: voiceMode,
      hashtags: hashtags || [],
      status: "draft",
    });
    return { success: true, atom: data };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function updateAtomDraft(
  atomId: string,
  fields: AtomUpdateFields,
) {
  if (!getDB()) return { error: "Database not configured" };

  try {
    const data = await upsertAtomRecord({
      id: atomId,
      ...fields,
      updated_at: now(),
    });
    return { success: true, atom: data };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function deleteAtomDraft(atomId: string) {
  if (!getDB()) return { error: "Database not configured" };

  try {
    await deleteAtomRecord(atomId);
    return { success: true };
  } catch (error) {
    return { error: String(error) };
  }
}
