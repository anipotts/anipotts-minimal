import {
  ControlPlaneLayout,
  HandoffTable,
  SectionHeader,
} from "~/components/ControlPlane";
import { handoffs } from "~/data/control-plane";

export default function HandoffsRoute() {
  return (
    <ControlPlaneLayout
      title="handoffs"
      deck="Newest, stale, unabsorbed, and owner-routed handoffs with proof pointers. This keeps agent state out of chat memory."
    >
      <section>
        <SectionHeader
          eyebrow="coordination"
          title="handoff absorption"
          detail="newest / stale / unabsorbed / owner thread"
        />
        <HandoffTable handoffs={handoffs} />
      </section>
    </ControlPlaneLayout>
  );
}
