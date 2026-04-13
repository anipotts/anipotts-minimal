"use server";

import { searchQCTwitter, searchQCReddit } from "@anipotts/lib/quantercise";
import { withAuth } from "../actions";
import { getQCEnvForProject } from "@/lib/project-env-adapter";

export const searchTwitter = withAuth(
  async (
    slug: string,
    params?: {
      queries?: string;
      limit?: number;
      days?: number;
    },
  ) => {
    return searchQCTwitter(getQCEnvForProject(slug), params);
  },
);

export const searchReddit = withAuth(
  async (
    slug: string,
    params?: {
      subreddits?: string;
      keywords?: string;
      days?: number;
      limit?: number;
    },
  ) => {
    return searchQCReddit(getQCEnvForProject(slug), params);
  },
);
