import {
  ApprovalBridgePanel,
  ControlPlaneLayout,
  NeedsAniQueue,
  SectionHeader,
} from "~/components/ControlPlane";
import { approvalBridgeDesign } from "~/data/approval-bridge";
import { needsAniItems } from "~/data/control-plane";

export default function NeedsAniRoute() {
  return (
    <ControlPlaneLayout
      title="needs ani"
      deck="Blocked-by-Ani items from the admin feed, rendered read-only with exact next action, related proof ids, and future approval bridge interface notes."
    >
      <section>
        <SectionHeader
          eyebrow="approval queue"
          title="blocked by ani"
          detail={`${needsAniItems.length} items`}
        />
        <NeedsAniQueue items={needsAniItems} />
      </section>

      <section>
        <SectionHeader
          eyebrow="future bridge"
          title="iMessage approval interface"
          detail="design only"
        />
        <ApprovalBridgePanel design={approvalBridgeDesign} />
      </section>
    </ControlPlaneLayout>
  );
}
