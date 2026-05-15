import { CommitFeed } from "~/components/CommitFeed";
import { LinkVaultPanel } from "~/components/LinkVaultPanel";

export default function Home() {
  return (
    <main>
      <h1>anipotts / admin</h1>
      <p class="muted">
        v2 build. SolidStart on Cloudflare Workers, live state via Durable Object WebSockets. No
        polling.
      </p>
      <LinkVaultPanel />
      <CommitFeed />
    </main>
  );
}
