import {
  ContentPreviewGate,
  ContentPreviewQueue,
  ControlPlaneLayout,
  SectionHeader,
} from "~/components/ControlPlane";
import {
  contentInventorySource,
  contentPreviewItems,
} from "~/data/content-inventory";

export default function ContentPreviewRoute() {
  return (
    <ControlPlaneLayout
      title="content previews"
      deck="Draft content operation previews for public-site text. These compare current and proposed values without saving, publishing, deploying, or sending anything."
    >
      <section>
        <SectionHeader
          eyebrow="draft operation model"
          title="preview queue"
          detail={`${contentPreviewItems.length} proposals / ${contentInventorySource.mode}`}
        />
        <ContentPreviewQueue items={contentPreviewItems} />
      </section>

      <section>
        <SectionHeader
          eyebrow="authority"
          title="no write path"
          detail={contentInventorySource.architecture_doc}
        />
        <ContentPreviewGate />
      </section>
    </ControlPlaneLayout>
  );
}
