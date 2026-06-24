import {
  ControlPlaneLayout,
  RepoTable,
  RuntimeRepoOverlayPanel,
  SectionHeader,
} from "~/components/ControlPlane";
import { repos } from "~/data/control-plane";

export default function ReposRoute() {
  return (
    <ControlPlaneLayout
      title="repos"
      deck="Static repo states with local-dev runtime overlays for branch, git availability, dirty counts, and deploy impact."
    >
      <section>
        <SectionHeader
          eyebrow="source state"
          title="repo and worktree risk"
          detail="static bundle plus runtime overlay"
        />
        <RepoTable repos={repos} />
      </section>

      <section>
        <RuntimeRepoOverlayPanel />
      </section>
    </ControlPlaneLayout>
  );
}
