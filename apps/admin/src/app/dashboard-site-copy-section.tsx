import { fetchCmsEditorSnapshot } from "@anipotts/lib/cms";
import HomeCopyEditor from "./home-copy-editor";
import SiteContentEditor from "./site-content-editor";

export async function SiteCopyPanel() {
  const snapshot = await fetchCmsEditorSnapshot();

  return (
    <div className="space-y-4">
      <HomeCopyEditor
        content={snapshot.homepage}
        source={snapshot.homepageMeta.source === "cms" ? "cms" : "fallback"}
        updatedAt={snapshot.homepageMeta.updated_at}
        version={snapshot.homepageMeta.version}
      />
      <SiteContentEditor
        projects={snapshot.projects}
        writing={snapshot.writing}
        newsletter={snapshot.newsletter}
        newsletterMeta={snapshot.newsletterMeta}
      />
    </div>
  );
}
