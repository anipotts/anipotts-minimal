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
      deck="The human syscall queue. Each card is one typed return value Ani can provide so agents can continue and record proof."
    >
      <section>
        <SectionHeader
          eyebrow="syscall queue"
          title="needs ani"
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
