import {
  ControlPlaneLayout,
  DestructiveGrid,
  SectionHeader,
} from "~/components/ControlPlane";
import { destructiveGates } from "~/data/control-plane";

export default function DestructiveOpsRoute() {
  return (
    <ControlPlaneLayout
      title="destructive ops"
      deck="Delete, auth, secrets, DNS, deploy, payment, and account operations are hard gated. This route shows proof requirements only."
    >
      <section>
        <SectionHeader
          eyebrow="hard gates"
          title="no live controls"
          detail="proof-backed approvals only"
        />
        <DestructiveGrid gates={destructiveGates} />
      </section>
    </ControlPlaneLayout>
  );
}
