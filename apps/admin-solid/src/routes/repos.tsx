import {
  ControlPlaneLayout,
  RepoTable,
  SectionHeader,
} from "~/components/ControlPlane";
import { repos } from "~/data/control-plane";

export default function ReposRoute() {
  return (
    <ControlPlaneLayout
      title="repos"
      deck="Repository status placeholders for dirty state, branch position, active worktrees, and PR or deploy impact."
    >
      <section>
        <SectionHeader
          eyebrow="source state"
          title="repo and worktree risk"
          detail="mocked until git publisher lands"
        />
        <RepoTable repos={repos} />
      </section>
    </ControlPlaneLayout>
  );
}
