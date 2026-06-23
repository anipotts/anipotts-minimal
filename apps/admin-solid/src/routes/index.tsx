import { CommitFeed } from "~/components/CommitFeed";
import { FleetDashboard } from "~/components/FleetDashboard";
import { LinkVaultPanel } from "~/components/LinkVaultPanel";

export default function Home() {
  return (
    <main>
      <FleetDashboard />
      <section class="section-block" aria-labelledby="feeds-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">durable objects</p>
            <h2 id="feeds-title">live feeds</h2>
          </div>
        </div>
        <div class="feed-grid">
          <CommitFeed />
          <LinkVaultPanel />
        </div>
      </section>
    </main>
  );
}
