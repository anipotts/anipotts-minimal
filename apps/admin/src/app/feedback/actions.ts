"use server";

import { getQCFeedback, updateQCFeedback } from "@anipotts/lib/quantercise";
import { withAuth } from "../lib/with-auth";
import { getQCEnvForProject } from "@/lib/project-env-adapter";

export const getFeedback = withAuth(
  async (
    slug: string,
    params?: {
      status?: string;
      type?: string;
      page?: number;
    },
  ) => {
    return getQCFeedback(getQCEnvForProject(slug), params);
  },
);

export const updateFeedback = withAuth(
  async (
    slug: string,
    issueNumber: number,
    action: "close" | "reopen" | "comment",
    comment?: string,
  ) => {
    return updateQCFeedback(
      getQCEnvForProject(slug),
      issueNumber,
      action,
      comment,
    );
  },
);
