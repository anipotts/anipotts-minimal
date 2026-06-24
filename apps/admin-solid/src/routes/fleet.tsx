import {
  ControlPlaneLayout,
  FleetGrid,
  SectionHeader,
} from "~/components/ControlPlane";
import { operations } from "~/data/control-plane";

export default function FleetRoute() {
  return (
    <ControlPlaneLayout
      title="fleet"
      deck="Machine-level status placeholders for ap-pro and ap-mini. Live heartbeats come later through workers/state and chief/infra proof."
    >
      <section>
        <SectionHeader
          eyebrow="machines"
          title="pro and mini"
          detail="Codex, Claude, task, mode, heartbeat"
        />
        <FleetGrid operations={operations} />
      </section>
    </ControlPlaneLayout>
  );
}
