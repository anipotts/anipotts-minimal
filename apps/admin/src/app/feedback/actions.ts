"use server";

import { getQCFeedback, updateQCFeedback } from "@anipotts/lib/quantercise";
import { requireAuth } from "../actions";
import { getQCEnv } from "@/lib/qc-env";

export async function getFeedback(params?: {
  status?: string;
  type?: string;
  page?: number;
}) {
  const authError = await requireAuth();
  if (authError) return authError;
  return getQCFeedback(getQCEnv(), params);
}

export async function updateFeedback(
  issueNumber: number,
  action: "close" | "reopen" | "comment",
  comment?: string,
) {
  const authError = await requireAuth();
  if (authError) return authError;
  return updateQCFeedback(getQCEnv(), issueNumber, action, comment);
}
