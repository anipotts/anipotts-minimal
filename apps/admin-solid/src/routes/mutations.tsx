import {
  ControlPlaneLayout,
  MutationTable,
  SectionHeader,
} from "~/components/ControlPlane";
import { authorityCards, proofs, workCards } from "~/data/control-plane";

export default function MutationsRoute() {
  return (
    <ControlPlaneLayout
      title="mutation queue"
      deck="Proposed, approved, running, verified, and blocked operations in one place. This page does not execute anything."
    >
      <section>
        <SectionHeader
          eyebrow="operation state"
          title="mutation lifecycle"
          detail="proposed / approved / running / verified / blocked"
        />
        <MutationTable rows={workCards} authorities={authorityCards} proofs={proofs} />
      </section>
    </ControlPlaneLayout>
  );
}
