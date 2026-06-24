import {
  ContentInventoryTable,
  ContentWriteGate,
  ControlPlaneLayout,
  SectionHeader,
} from "~/components/ControlPlane";
import {
  contentInventory,
  contentInventorySource,
} from "~/data/content-inventory";

export default function ContentRoute() {
  return (
    <ControlPlaneLayout
      title="content inventory"
      deck="A read-only map of public-site text and content sources. This page shows what can become editable later without adding save behavior."
    >
      <section>
        <SectionHeader
          eyebrow="public site content"
          title="editable surface candidates"
          detail={`${contentInventory.length} rows / ${contentInventorySource.mode}`}
        />
        <ContentInventoryTable rows={contentInventory} />
      </section>

      <section>
        <SectionHeader
          eyebrow="authority"
          title="writes stay gated"
          detail={contentInventorySource.architecture_doc}
        />
        <ContentWriteGate />
      </section>
    </ControlPlaneLayout>
  );
}
