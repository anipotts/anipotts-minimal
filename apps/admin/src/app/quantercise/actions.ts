"use server";

import { qcMutate } from "@anipotts/lib/quantercise";
import type { QCActionResponse, QCUserAction } from "@anipotts/lib/quantercise";
import { withAuth } from "../lib/with-auth";
import { getQCEnv } from "@/lib/qc-env";

export const userAction = withAuth(
  async (userId: string, action: QCUserAction) => {
    return qcMutate<QCActionResponse>(
      `/api/admin/users/${encodeURIComponent(userId)}/actions`,
      getQCEnv(),
      { action },
    );
  },
);

export const updateFeatureFlag = withAuth(
  async (flagId: string, active: boolean, rolloutPercentage?: number) => {
    return qcMutate<{ success: boolean }>(
      "/api/admin/feature-flags",
      getQCEnv(),
      { flagId, active, rolloutPercentage },
      "PATCH",
    );
  },
);

export const updateProblem = withAuth(
  async (id: string, data: Record<string, unknown>) => {
    return qcMutate<{ success: boolean }>(
      `/api/admin/problems/${encodeURIComponent(id)}`,
      getQCEnv(),
      data,
      "PATCH",
    );
  },
);

export const resolveFailedEvent = withAuth(
  async (id: string, source: string, notes?: string) => {
    return qcMutate<{ success: boolean }>(
      `/api/admin/failed-events/${encodeURIComponent(id)}`,
      getQCEnv(),
      { source, status: "resolved", notes },
      "PATCH",
    );
  },
);
