"use server";

import { searchQCTwitter, searchQCReddit } from "@anipotts/lib/quantercise";
import { requireAuth } from "../actions";
import { getQCEnv } from "@/lib/qc-env";

export async function searchTwitter(params?: {
  queries?: string;
  limit?: number;
  days?: number;
}) {
  const authError = await requireAuth();
  if (authError) return authError;
  return searchQCTwitter(getQCEnv(), params);
}

export async function searchReddit(params?: {
  subreddits?: string;
  keywords?: string;
  days?: number;
  limit?: number;
}) {
  const authError = await requireAuth();
  if (authError) return authError;
  return searchQCReddit(getQCEnv(), params);
}
