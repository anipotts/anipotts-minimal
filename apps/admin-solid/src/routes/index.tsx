import {
  ControlPlaneLayout,
  SectionHeader,
  WorkCardView,
} from "~/components/ControlPlane";
import { coverageCards, feedSource, workCards } from "~/data/control-plane";

export default function Home() {
  return (
    <ControlPlaneLayout
      title="control-plane shell"
      deck={`A read-only admin surface for deciding what is safe to do next. This static feed copy comes from Infra ${feedSource.infra_commit} and keeps every live mutation behind proof and approval gates.`}
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

      <section>
        <SectionHeader
          eyebrow="feed coverage"
          title="what the bundle can see"
          detail={feedSource.snapshot_type}
        />
        <div class="grid actions-grid">
          {coverageCards.map((card) => (
            <WorkCardView card={card} />
          ))}
        </div>
      </section>
    </ControlPlaneLayout>
  );
}
