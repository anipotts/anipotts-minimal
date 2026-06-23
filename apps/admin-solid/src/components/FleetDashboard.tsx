import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { getStateApi } from "~/lib/config";

type FeedStatus = "live" | "degraded" | "blocked" | "planned";

type ServiceCheck = {
  label: string;
  target: string;
  status: FeedStatus;
  detail: string;
  checkedAt?: string;
};

type GitHubPull = {
  number: number;
  title: string;
  html_url: string;
  head: { ref: string };
  user: { login: string };
};

type StateHealth = {
  ok: boolean;
  ts: string;
};

function statusLabel(status: FeedStatus): string {
  if (status === "live") return "live";
  if (status === "degraded") return "degraded";
  if (status === "blocked") return "gated";
  return "planned";
}

function formatTime(value?: string): string {
  if (!value) return "not checked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function checkJson(url: string): Promise<{
  ok: boolean;
  detail: string;
  checkedAt: string;
}> {
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return {
      ok: res.ok,
      detail: `${res.status} in ${Date.now() - startedAt}ms`,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "request failed",
      checkedAt: new Date().toISOString(),
    };
  }
}

export function FleetDashboard() {
  const [checks, setChecks] = createSignal<ServiceCheck[]>([]);
  const [pulls, setPulls] = createSignal<GitHubPull[]>([]);
  const [githubError, setGithubError] = createSignal<string | null>(null);
  const stateApi = getStateApi();

  onMount(() => {
    void refresh();
  });

  async function refresh(): Promise<void> {
    setGithubError(null);

    const [stateHealth, stateCommits, stateLinks, miniHealth] =
      await Promise.all([
        checkJson(`${stateApi}/health`),
        checkJson(`${stateApi}/api/commits?limit=1`),
        checkJson(`${stateApi}/api/links`),
        checkJson("https://api.mini.anipotts.com/health"),
      ]);

    setChecks([
      {
        label: "state worker",
        target: `${stateApi}/health`,
        status: stateHealth.ok ? "live" : "degraded",
        detail: stateHealth.detail,
        checkedAt: stateHealth.checkedAt,
      },
      {
        label: "commit feed",
        target: `${stateApi}/api/commits`,
        status: stateCommits.ok ? "live" : "degraded",
        detail: stateCommits.detail,
        checkedAt: stateCommits.checkedAt,
      },
      {
        label: "link vault",
        target: `${stateApi}/api/links`,
        status: stateLinks.ok ? "live" : "degraded",
        detail: stateLinks.detail,
        checkedAt: stateLinks.checkedAt,
      },
      {
        label: "mini api",
        target: "https://api.mini.anipotts.com/health",
        status: miniHealth.ok ? "live" : "blocked",
        detail: miniHealth.ok
          ? miniHealth.detail
          : `${miniHealth.detail}. route is gated on mini tunnel repair`,
        checkedAt: miniHealth.checkedAt,
      },
    ]);

    try {
      const res = await fetch(
        "https://api.github.com/repos/anipotts/anipotts.com/pulls?state=open&per_page=20",
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (!res.ok) throw new Error(`github returned ${res.status}`);
      setPulls((await res.json()) as GitHubPull[]);
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "github request failed");
    }
  }

  const openDependabotCount = createMemo(
    () => pulls().filter((pull) => pull.user.login === "dependabot[bot]").length,
  );

  return (
    <div class="dashboard-stack">
      <section class="hero-band">
        <div>
          <p class="eyebrow">control plane</p>
          <h1>anipotts admin</h1>
          <p class="lede">
            Live fleet feed for code, machines, business, brand, and open loops.
            This version starts with safe read-only sources and names the bridges
            still gated behind server tokens or mini tunnel repair.
          </p>
        </div>
        <div class="hero-actions">
          <button type="button" onClick={() => void refresh()}>
            refresh
          </button>
          <a href="https://legacy-admin.anipotts.com">legacy admin</a>
        </div>
      </section>

      <section class="section-block" aria-labelledby="status-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">live checks</p>
            <h2 id="status-title">fleet status</h2>
          </div>
          <span class="muted">state api: {stateApi}</span>
        </div>
        <div class="metric-grid">
          <For each={checks()}>
            {(check) => (
              <article class="metric-card">
                <div class="card-row">
                  <span class="card-title">{check.label}</span>
                  <span class="status-pill" data-status={check.status}>
                    {statusLabel(check.status)}
                  </span>
                </div>
                <p>{check.detail}</p>
                <span class="muted">{formatTime(check.checkedAt)}</span>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="section-block" aria-labelledby="work-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">github</p>
            <h2 id="work-title">active work</h2>
          </div>
          <span class="muted">
            {pulls().length} open, {openDependabotCount()} dependabot
          </span>
        </div>
        <Show
          when={!githubError()}
          fallback={<p class="empty">GitHub feed degraded: {githubError()}</p>}
        >
          <div class="work-list">
            <For each={pulls().slice(0, 8)}>
              {(pull) => (
                <a class="work-item" href={pull.html_url}>
                  <span class="work-number">#{pull.number}</span>
                  <span class="work-title">{pull.title}</span>
                  <span class="muted">{pull.head.ref}</span>
                </a>
              )}
            </For>
          </div>
        </Show>
      </section>

      <section class="section-block" aria-labelledby="sources-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">source map</p>
            <h2 id="sources-title">next bridges</h2>
          </div>
        </div>
        <div class="source-grid">
          <SourceCard
            title="business"
            status="planned"
            body="deals, deadlines, revenue, domains, and compliance should come from D1 through a server-side admin-solid endpoint."
          />
          <SourceCard
            title="brand"
            status="planned"
            body="brand content, sponsorships, proof artifacts, and publishing status need a typed read model before write tools move over."
          />
          <SourceCard
            title="responsibilities"
            status="planned"
            body="open loops should aggregate Infra bus refs, handoffs, NEEDS-ANI, and active PR blockers without printing private payloads."
          />
          <SourceCard
            title="machines"
            status="blocked"
            body="mini live machine data is waiting on the api.mini.anipotts.com tunnel repair gate."
          />
        </div>
      </section>
    </div>
  );
}

function SourceCard(props: {
  title: string;
  status: FeedStatus;
  body: string;
}) {
  return (
    <article class="source-card">
      <div class="card-row">
        <span class="card-title">{props.title}</span>
        <span class="status-pill" data-status={props.status}>
          {statusLabel(props.status)}
        </span>
      </div>
      <p>{props.body}</p>
    </article>
  );
}

export type { StateHealth };
