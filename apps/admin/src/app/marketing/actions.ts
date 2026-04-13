"use server";

import { searchQCTwitter, searchQCReddit } from "@anipotts/lib/quantercise";
import { requireAuth } from "../actions";
import { getQCEnvForProject } from "@/lib/project-env-adapter";

export async function searchTwitter(
  slug: string,
  params?: {
    queries?: string;
    limit?: number;
    days?: number;
  },
) {
  const authError = await requireAuth();
  if (authError) return authError;
  return searchQCTwitter(getQCEnvForProject(slug), params);
}

export async function searchReddit(
  slug: string,
  params?: {
    subreddits?: string;
    keywords?: string;
    days?: number;
    limit?: number;
  },
) {
  const authError = await requireAuth();
  if (authError) return authError;
  return searchQCReddit(getQCEnvForProject(slug), params);
}
