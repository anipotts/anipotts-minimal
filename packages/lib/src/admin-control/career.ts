import type {
  AdminCareerSnapshot,
  AdminCareerTarget,
  AdminControlProjections,
} from "./types";

export type AdminCareerProjectionView = {
  displaySnapshot: AdminCareerSnapshot | null;
  statusSnapshot: AdminCareerSnapshot | null;
  targets: AdminCareerTarget[];
};

export function selectAdminCareerProjectionView(
  projections: Pick<
    AdminControlProjections,
    "career_snapshots" | "career_targets"
  >,
): AdminCareerProjectionView {
  const statusSnapshot = projections.career_snapshots[0] ?? null;
  const displaySnapshot =
    projections.career_snapshots.find((snapshot) => !snapshot.stale) ??
    statusSnapshot;
  const targets = displaySnapshot
    ? projections.career_targets.filter(
        (target) => target.snapshot_ref === displaySnapshot.snapshot_id,
      )
    : [];
  return { displaySnapshot, statusSnapshot, targets };
}
