"use server";

import { getQCFeedback, updateQCFeedback } from "@anipotts/lib/quantercise";
import { requireAuth } from "../actions";
import { getQCEnvForProject } from "@/lib/project-env-adapter";

export async function getFeedback(
  slug: string,
  params?: {
    status?: string;
    type?: string;
    page?: number;
  },
) {
  const authError = await requireAuth();
  if (authError) return authError;
  return getQCFeedback(getQCEnvForProject(slug), params);
}

export async function updateFeedback(
  slug: string,
  issueNumber: number,
  action: "close" | "reopen" | "comment",
  comment?: string,
) {
  const authError = await requireAuth();
  if (authError) return authError;
  return updateQCFeedback(
    getQCEnvForProject(slug),
    issueNumber,
    action,
    comment,
  );
}
