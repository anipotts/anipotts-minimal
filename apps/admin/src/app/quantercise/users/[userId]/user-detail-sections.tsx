import type { QCUser } from "@anipotts/lib/quantercise";
import { UserActions } from "./user-actions";
import {
  UserStatsPanel,
  UserSubscriptionPanel,
} from "./user-detail-metric-panels";
import { UserProfilePanel } from "./user-detail-profile-panel";

export function UserDetailPanels({
  userId,
  user,
}: {
  userId: string;
  user: QCUser;
}) {
  const sub = user.subscription;

  return (
    <div className="space-y-4">
      <UserProfilePanel user={user} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UserSubscriptionPanel user={user} />
        <UserStatsPanel user={user} />
      </div>

      <UserActions userId={userId} subscription={sub} />
    </div>
  );
}
