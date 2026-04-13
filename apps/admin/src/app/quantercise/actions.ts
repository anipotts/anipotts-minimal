"use server";

import { qcMutate } from "@anipotts/lib/quantercise";
import type { QCActionResponse, QCUserAction } from "@anipotts/lib/quantercise";
import { requireAuth } from "../actions";
import { getQCEnv } from "@/lib/qc-env";

export async function userAction(userId: string, action: QCUserAction) {
  const authError = await requireAuth();
  if (authError) return authError;
  return qcMutate<QCActionResponse>(
    `/api/admin/users/${encodeURIComponent(userId)}/actions`,
    getQCEnv(),
    { action },
  );
}

export async function updateFeatureFlag(
  flagId: string,
  active: boolean,
  rolloutPercentage?: number,
) {
  const authError = await requireAuth();
  if (authError) return authError;
  return qcMutate<{ success: boolean }>(
    "/api/admin/feature-flags",
    getQCEnv(),
    { flagId, active, rolloutPercentage },
    "PATCH",
  );
}

export async function updateProblem(id: string, data: Record<string, unknown>) {
  const authError = await requireAuth();
  if (authError) return authError;
  return qcMutate<{ success: boolean }>(
    `/api/admin/problems/${encodeURIComponent(id)}`,
    getQCEnv(),
    data,
    "PATCH",
  );
}

export async function resolveFailedEvent(
  id: string,
  source: string,
  notes?: string,
) {
  const authError = await requireAuth();
  if (authError) return authError;
  return qcMutate<{ success: boolean }>(
    `/api/admin/failed-events/${encodeURIComponent(id)}`,
    getQCEnv(),
    { source, status: "resolved", notes },
    "PATCH",
  );
}
