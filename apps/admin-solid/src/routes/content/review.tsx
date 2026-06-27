import {
  ContentReviewBoard,
  ContentReviewGate,
  ControlPlaneLayout,
  SectionHeader,
} from "~/components/ControlPlane";
import {
  contentInventory,
  contentInventorySource,
  contentPreviewItems,
} from "~/data/content-inventory";

export default function ContentReviewRoute() {
  return (
    <ControlPlaneLayout
      title="content review"
      deck="A read-only editorial queue that groups current public-site sources beside inert proposal previews. It shows what is safe to review next without adding save or publish behavior."
    >
      <section>
        <SectionHeader
          eyebrow="editorial workbench"
          title="source to proposal review"
          detail={`${contentInventory.length} sources / ${contentPreviewItems.length} previews / ${contentInventorySource.mode}`}
        />
        <ContentReviewBoard
          inventory={contentInventory}
          previews={contentPreviewItems}
        />
      </section>

      <section>
        <SectionHeader
          eyebrow="no-write contract"
          title="path to future edits"
          detail={contentInventorySource.architecture_doc}
        />
        <ContentReviewGate />
      </section>
    </ControlPlaneLayout>
  );
}
