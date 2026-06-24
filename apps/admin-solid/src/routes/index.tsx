import {
  ControlPlaneLayout,
  SectionHeader,
  WorkCardView,
} from "~/components/ControlPlane";
import { workCards } from "~/data/control-plane";

export default function Home() {
  return (
    <ControlPlaneLayout
      title="control-plane shell"
      deck="A read-only admin surface for deciding what is safe to do next. This first slice uses local sample data and keeps every live mutation behind proof and approval gates."
    >
      <section>
        <SectionHeader
          eyebrow="safe next actions"
          title="what to do next"
          detail="mocked local data"
        />
        <div class="grid actions-grid">
          {workCards.map((card) => (
            <WorkCardView card={card} />
          ))}
        </div>
      </section>
    </ControlPlaneLayout>
  );
}
