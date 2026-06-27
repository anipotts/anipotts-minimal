import { A } from "@solidjs/router";
import { createSignal, For, onMount, Show } from "solid-js";
import type { JSX } from "solid-js";
import type { ApprovalBridgeDesign } from "~/data/approval-bridge";
import type {
  AuthorityCard,
  ControlState,
  DestructiveGate,
  HandoffCard,
  NeedsAniItem,
  OperationCard,
  ProofCard,
  RepoCard,
  RiskLevel,
  RuntimeOverlayResponse,
  RuntimeRepoOverlay,
  WorkCard,
} from "~/data/control-plane";
import type { ContentInventoryItem } from "~/data/content-inventory";
import type { ContentPreviewItem } from "~/data/content-inventory";
import { topStrip } from "~/data/control-plane";

const navItems = [
  { href: "/", label: "overview" },
  { href: "/content", label: "content" },
  { href: "/content/preview", label: "previews" },
  { href: "/content/review", label: "review" },
  { href: "/auth/passkey", label: "passkey auth" },
  { href: "/mutations", label: "mutations" },
  { href: "/fleet", label: "fleet" },
  { href: "/repos", label: "repos" },
  { href: "/needs-ani", label: "needs ani" },
  { href: "/handoffs", label: "handoffs" },
  { href: "/ops/destructive", label: "destructive ops" },
];

export function ControlPlaneLayout(props: {
  title: string;
  deck: string;
  children: JSX.Element;
}) {
  return (
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <p class="eyebrow">admin.anipotts.com</p>
          <strong>operator console</strong>
          <span>read-only control plane</span>
        </div>

        <nav class="side-nav" aria-label="admin control-plane sections">
          <For each={navItems}>
            {(item) => (
              <A href={item.href} end={item.href === "/"}>
                {item.label}
              </A>
            )}
          </For>
        </nav>

        <div class="side-note">
          <span class="model-chip">
            intent / authority / operation / proof / state
          </span>
          <p class="muted">No write path is active from this shell.</p>
        </div>
      </aside>

      <main>
        <header class="app-header">
          <div>
            <p class="eyebrow">safe next action</p>
            <h1>{props.title}</h1>
            <p class="lede">{props.deck}</p>
          </div>
          <div class="model-chip">read-only first</div>
        </header>

        <TopStrip />

        <div class="page-stack">{props.children}</div>
      </main>
    </div>
  );
}

export function TopStrip() {
  return (
    <section class="top-strip" aria-label="fleet control states">
      <For each={topStrip}>
        {(item) => (
          <article class="strip-card" data-state={stateKey(item.status)}>
            <span class="strip-count">{item.title}</span>
            <span class="strip-label">{item.status}</span>
            <span class="muted">{item.next_safe_action}</span>
          </article>
        )}
      </For>
    </section>
  );
}

export function StatusPill(props: { state: ControlState }) {
  return (
    <span class="status-pill" data-state={stateKey(props.state)}>
      {props.state}
    </span>
  );
}

export function RiskPill(props: { risk: RiskLevel }) {
  return (
    <span class="risk-pill" data-risk={props.risk}>
      {props.risk}
    </span>
  );
}

export function SectionHeader(props: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div class="section-header">
      <div>
        <p class="eyebrow">{props.eyebrow}</p>
        <h2>{props.title}</h2>
      </div>
      <Show when={props.detail}>
        <span class="muted">{props.detail}</span>
      </Show>
    </div>
  );
}

export function WorkCardView(props: { card: WorkCard }) {
  return (
    <article class="action-card">
      <div class="card-top">
        <div>
          <h3>{props.card.title}</h3>
          <p class="muted">{props.card.next_safe_action}</p>
        </div>
        <div class="pill-row">
          <StatusPill state={props.card.status} />
          <RiskPill risk={props.card.risk_level} />
        </div>
      </div>
      <FlowGrid
        intent={props.card.intent}
        authority={props.card.authority_state}
        operation={props.card.operation_summary}
        proof={props.card.proof_ids.join(", ")}
        state={props.card.status}
      />
    </article>
  );
}

export function FlowGrid(props: {
  intent: string;
  authority: string;
  operation: string;
  proof: string;
  state: ControlState | string;
}) {
  return (
    <dl class="flow-grid">
      <FlowTerm label="intent" value={props.intent} />
      <FlowTerm label="authority" value={props.authority} />
      <FlowTerm label="operation" value={props.operation} />
      <FlowTerm label="proof" value={props.proof} />
      <FlowTerm label="state" value={props.state} />
    </dl>
  );
}

function FlowTerm(props: { label: string; value: string }) {
  return (
    <div>
      <dt>{props.label}</dt>
      <dd>{props.value}</dd>
    </div>
  );
}

export function MutationTable(props: {
  rows: WorkCard[];
  authorities: AuthorityCard[];
  proofs: ProofCard[];
}) {
  return (
    <div class="table-card">
      <For each={props.rows}>
        {(row) => (
          <article class="table-row mutation-row">
            <div>
              <h3>{row.title}</h3>
              <p class="muted">{row.next_safe_action}</p>
            </div>
            <FlowGrid
              intent={row.intent}
              authority={row.authority_state}
              operation={row.operation_summary}
              proof={row.proof_ids.join(", ")}
              state={row.status}
            />
            <div class="pill-row align-end">
              <StatusPill state={row.status} />
              <RiskPill risk={row.risk_level} />
            </div>
          </article>
        )}
      </For>

      <For each={props.authorities}>
        {(row) => (
          <article class="table-row authority-row">
            <div>
              <h3>{row.title}</h3>
              <p class="muted">authority_state: {row.authority_state}</p>
            </div>
            <Fact
              label="required_approval_ids"
              value={row.required_approval_ids.join(", ")}
            />
            <Fact
              label="allowed_actions"
              value={row.allowed_actions.join(", ")}
            />
            <Fact
              label="forbidden_actions"
              value={row.forbidden_actions.join(", ")}
            />
            <div class="pill-row align-end">
              <StatusPill state={row.status} />
              <RiskPill risk={row.risk_level} />
            </div>
          </article>
        )}
      </For>

      <For each={props.proofs}>
        {(proof) => (
          <article class="table-row proof-row">
            <div>
              <h3>{proof.title}</h3>
              <p class="muted">{proof.summary}</p>
            </div>
            <Fact label="proof_ids" value={proof.proof_ids.join(", ")} />
            <Fact label="evidence_uri" value={proof.evidence_uri} />
            <Fact label="redaction" value={proof.redaction} />
            <StatusPill state={proof.status} />
          </article>
        )}
      </For>
    </div>
  );
}

export function FleetGrid(props: { operations: OperationCard[] }) {
  return (
    <div class="grid two">
      <For each={props.operations}>
        {(operation) => (
          <article class="panel-card">
            <div class="card-top">
              <div>
                <p class="eyebrow">{operation.machine}</p>
                <h3>{operation.title}</h3>
              </div>
              <StatusPill state={operation.status} />
            </div>
            <div class="fact-grid">
              <Fact label="agent" value={operation.agent} />
              <Fact label="phase" value={operation.phase} />
              <Fact label="heartbeat_at" value={operation.heartbeat_at} />
              <Fact label="stop_path" value={operation.stop_path} />
            </div>
            <p class="proof-line">
              next_safe_action: {operation.next_safe_action}
            </p>
          </article>
        )}
      </For>
    </div>
  );
}

export function RepoTable(props: { repos: RepoCard[] }) {
  return (
    <div class="table-card">
      <For each={props.repos}>
        {(repo) => (
          <article class="table-row repo-row">
            <div>
              <h3>{repo.repo}</h3>
              <p class="muted">{repo.path}</p>
            </div>
            <Fact label="branch" value={repo.branch} />
            <Fact
              label="dirty_tracked"
              value={formatList(repo.dirty_tracked)}
            />
            <Fact
              label="untracked_count"
              value={String(repo.untracked_count)}
            />
            <Fact label="deploy_impact" value={repo.deploy_impact} />
            <Fact label="proof_ids" value={repo.proof_ids.join(", ")} />
            <p class="proof-line">next_safe_action: {repo.next_safe_action}</p>
          </article>
        )}
      </For>
    </div>
  );
}

export function RuntimeRepoOverlayPanel() {
  const [runtime, setRuntime] = createSignal<RuntimeOverlayResponse | null>(
    null,
  );

  onMount(async () => {
    try {
      const response = await fetch("/api/admin/runtime-feed");
      setRuntime((await response.json()) as RuntimeOverlayResponse);
    } catch (error) {
      setRuntime({
        available: false,
        mode: "error",
        generated_at: null,
        machine: null,
        source_path:
          "/Users/anipotts/Infra/state/runtime/admin/admin-feed.current.json",
        safety: null,
        overlays: [],
        needs_ani_queue: [],
        error:
          error instanceof Error
            ? error.message
            : "runtime overlay fetch failed",
      });
    }
  });

  return (
    <div class="runtime-panel">
      <div class="section-header compact">
        <div>
          <p class="eyebrow">local-dev runtime</p>
          <h2>repo overlays</h2>
        </div>
        <Show
          when={runtime()}
          fallback={<span class="muted">loading local runtime feed</span>}
        >
          {(data) => (
            <span class="muted">
              {data().available
                ? `${data().overlays.length} overlays / ${data().machine ?? "unknown machine"}`
                : data().mode}
            </span>
          )}
        </Show>
      </div>

      <Show
        when={runtime()}
        fallback={<p class="proof-line">runtime loader is local-dev only</p>}
      >
        {(data) => (
          <>
            <Show
              when={data().available}
              fallback={
                <p class="proof-line">
                  runtime overlay unavailable: {data().error ?? data().mode}.
                  source_path: {data().source_path}
                </p>
              }
            >
              <div class="table-card">
                <For each={data().overlays}>
                  {(overlay) => <RuntimeOverlayRow overlay={overlay} />}
                </For>
              </div>
            </Show>

            <div class="runtime-safety">
              <Fact
                label="generated_at"
                value={data().generated_at ?? "not available"}
              />
              <Fact label="source_path" value={data().source_path} />
              <Fact
                label="safety_mode"
                value={data().safety?.mode ?? "not available"}
              />
              <Fact
                label="secret_values"
                value={String(data().safety?.secret_values_included ?? false)}
              />
              <Fact
                label="file_contents"
                value={String(data().safety?.file_contents_included ?? false)}
              />
              <Fact
                label="health_payloads"
                value={String(data().safety?.health_payloads_included ?? false)}
              />
            </div>
          </>
        )}
      </Show>
    </div>
  );
}

function RuntimeOverlayRow(props: { overlay: RuntimeRepoOverlay }) {
  return (
    <article class="table-row runtime-row">
      <div>
        <h3>{props.overlay.repo}</h3>
        <p class="muted">{props.overlay.repo_root_label}</p>
      </div>
      <Fact
        label="git"
        value={props.overlay.git_available ? "available" : "unavailable"}
      />
      <Fact label="branch" value={props.overlay.branch ?? "not a git tree"} />
      <Fact label="head_sha" value={props.overlay.head_sha ?? "none"} />
      <Fact
        label="ahead/behind"
        value={`${props.overlay.ahead ?? "n/a"} / ${props.overlay.behind ?? "n/a"}`}
      />
      <Fact
        label="dirty_tracked_count"
        value={String(props.overlay.dirty_tracked_count ?? "n/a")}
      />
      <Fact
        label="untracked_count"
        value={String(props.overlay.untracked_count ?? "n/a")}
      />
      <Fact label="deploy_impact" value={props.overlay.deploy_impact} />
      <p class="proof-line">
        {props.overlay.live_runtime_role}. {props.overlay.notes}
      </p>
    </article>
  );
}

export function HandoffTable(props: { handoffs: HandoffCard[] }) {
  return (
    <div class="table-card">
      <For each={props.handoffs}>
        {(handoff) => (
          <article class="table-row handoff-row">
            <div>
              <h3>{handoff.title}</h3>
              <p class="muted">{handoff.path}</p>
            </div>
            <StatusPill state={handoff.status} />
            <Fact label="freshness" value={handoff.freshness} />
            <Fact
              label="absorbed_at"
              value={handoff.absorbed_at ?? "not absorbed"}
            />
            <Fact label="target_owner" value={handoff.target_owner} />
            <Fact label="proof_ids" value={handoff.proof_ids.join(", ")} />
            <p class="proof-line">
              next_safe_action: {handoff.next_safe_action}
            </p>
          </article>
        )}
      </For>
    </div>
  );
}

const needGroups: Array<{
  bucket: NeedsAniItem["bucket"];
  title: string;
  detail: string;
}> = [
  {
    bucket: "unblockable_now",
    title: "unblockable now",
    detail: "answer these to let agents continue immediately",
  },
  {
    bucket: "waiting_on_account_or_device",
    title: "account or device",
    detail: "requires an external app, account, device, or credential step",
  },
  {
    bucket: "review_delete_packets",
    title: "review-delete packets",
    detail: "requires exact keep, archive, or delete approval after proof",
  },
  {
    bucket: "stale_or_closed",
    title: "stale",
    detail: "needs pruning before it can be answered",
  },
];

export function NeedsAniQueue(props: { items: NeedsAniItem[] }) {
  return (
    <div class="needs-grid">
      <For each={needGroups}>
        {(group) => {
          const items = props.items.filter(
            (item) => item.bucket === group.bucket,
          );
          return (
            <section class="table-card needs-group">
              <div class="needs-group-head">
                <div>
                  <p class="eyebrow">{group.detail}</p>
                  <h2>{group.title}</h2>
                </div>
                <span class="model-chip">{items.length} items</span>
              </div>
              <For each={items}>
                {(item) => (
                  <article class="table-row needs-ani-row">
                    <div>
                      <h3>{item.title}</h3>
                      <p class="muted">{item.why}</p>
                    </div>
                    <StatusPill state={item.status} />
                    <RiskPill risk={item.risk_level} />
                    <Fact label="type" value={item.type} />
                    <Fact label="owner" value={item.owner} />
                    <Fact label="ani_action" value={item.ani_action} />
                    <Fact label="agent_next" value={item.agent_next} />
                    <Fact label="expires_stale" value={item.expires_stale} />
                    <p class="proof-line">proof: {item.proof}</p>
                  </article>
                )}
              </For>
            </section>
          );
        }}
      </For>
    </div>
  );
}

const contentGroups: Array<{
  surface: ContentInventoryItem["surface"];
  title: string;
  detail: string;
}> = [
  {
    surface: "homepage",
    title: "homepage",
    detail: "hero copy, proof cards, mentions, and selected making cards",
  },
  {
    surface: "projects",
    title: "projects",
    detail: "card fields, detail bodies, links, tags, and visibility",
  },
  {
    surface: "writing",
    title: "writing",
    detail: "frontmatter, previews, status, artifacts, and body source",
  },
  {
    surface: "newsletter",
    title: "newsletter",
    detail: "subscribe block copy and future content records",
  },
];

export function ContentInventoryTable(props: { rows: ContentInventoryItem[] }) {
  return (
    <div class="content-grid">
      <For each={contentGroups}>
        {(group) => {
          const rows = props.rows.filter(
            (row) => row.surface === group.surface,
          );
          return (
            <section class="table-card content-group">
              <div class="needs-group-head">
                <div>
                  <p class="eyebrow">{group.detail}</p>
                  <h2>{group.title}</h2>
                </div>
                <span class="model-chip">{rows.length} rows</span>
              </div>
              <For each={rows}>
                {(row) => (
                  <article class="table-row content-row">
                    <div>
                      <h3>{row.title}</h3>
                      <p class="muted">{row.current_value}</p>
                    </div>
                    <Fact label="source_ref" value={row.source_ref} />
                    <Fact label="editability" value={row.editability} />
                    <RiskPill risk={row.risk_level} />
                    <Fact
                      label="required_authority"
                      value={formatList(row.required_authority)}
                    />
                    <Fact label="proof_ids" value={formatList(row.proof_ids)} />
                    <p class="proof-line">
                      next_safe_action: {row.next_safe_action}
                    </p>
                  </article>
                )}
              </For>
            </section>
          );
        }}
      </For>
    </div>
  );
}

const contentReviewSurfaces: Array<{
  surface: ContentInventoryItem["surface"];
  title: string;
  intent: string;
}> = [
  {
    surface: "homepage",
    title: "homepage",
    intent: "above-fold copy, proof cards, and public credibility claims",
  },
  {
    surface: "projects",
    title: "projects",
    intent: "project card fields, detail bodies, links, and source truth",
  },
  {
    surface: "writing",
    title: "writing",
    intent: "frontmatter, summaries, body edits, and public article links",
  },
  {
    surface: "newsletter",
    title: "newsletter",
    intent: "subscribe block copy, backfill planning, and send-path separation",
  },
];

export function ContentReviewBoard(props: {
  inventory: ContentInventoryItem[];
  previews: ContentPreviewItem[];
}) {
  return (
    <div class="review-board">
      <For each={contentReviewSurfaces}>
        {(surface) => {
          const inventoryRows = props.inventory.filter(
            (item) => item.surface === surface.surface,
          );
          const previewRows = props.previews.filter(
            (item) => item.surface === surface.surface,
          );
          const readyRows = inventoryRows.filter(
            (item) => item.editability === "ready",
          );
          const gatedRows = [
            ...inventoryRows.filter((item) => item.required_authority.length),
            ...previewRows.filter((item) => item.required_approval_ids.length),
          ];

          return (
            <section class="table-card review-surface">
              <div class="review-surface-head">
                <div>
                  <p class="eyebrow">{surface.intent}</p>
                  <h2>{surface.title}</h2>
                </div>
                <div class="review-counts">
                  <span>{inventoryRows.length} sources</span>
                  <span>{previewRows.length} previews</span>
                  <span>{gatedRows.length} gated</span>
                </div>
              </div>

              <div class="review-lanes">
                <div class="review-lane">
                  <div class="review-lane-head">
                    <h3>editable candidates</h3>
                    <span class="muted">{readyRows.length} ready</span>
                  </div>
                  <For each={inventoryRows}>
                    {(item) => (
                      <article class="review-item">
                        <div>
                          <h4>{item.title}</h4>
                          <p>{item.current_value}</p>
                        </div>
                        <div class="pill-row">
                          <span
                            class="status-pill"
                            data-state={item.editability}
                          >
                            {item.editability}
                          </span>
                          <RiskPill risk={item.risk_level} />
                        </div>
                        <Fact label="source_ref" value={item.source_ref} />
                        <Fact
                          label="next_safe_action"
                          value={item.next_safe_action}
                        />
                      </article>
                    )}
                  </For>
                </div>

                <div class="review-lane">
                  <div class="review-lane-head">
                    <h3>proposal queue</h3>
                    <span class="muted">{previewRows.length} inert</span>
                  </div>
                  <Show
                    when={previewRows.length > 0}
                    fallback={
                      <p class="review-empty">
                        no proposal yet. keep this surface in inventory until a
                        preview-only operation is modeled.
                      </p>
                    }
                  >
                    <For each={previewRows}>
                      {(item) => (
                        <article class="review-item proposal">
                          <div>
                            <h4>{item.title}</h4>
                            <p>{item.next_safe_action}</p>
                          </div>
                          <div class="pill-row">
                            <span
                              class="status-pill"
                              data-state={stateKey(item.status)}
                            >
                              {item.status}
                            </span>
                            <RiskPill risk={item.risk_level} />
                          </div>
                          <Fact
                            label="authority_state"
                            value={item.authority_state}
                          />
                          <Fact
                            label="blocked_actions"
                            value={formatList(item.blocked_actions)}
                          />
                        </article>
                      )}
                    </For>
                  </Show>
                </div>
              </div>
            </section>
          );
        }}
      </For>
    </div>
  );
}

export function ContentReviewGate() {
  return (
    <article class="panel-card review-gate">
      <div>
        <p class="eyebrow">content editing path</p>
        <h3>read, propose, review, then ask for authority</h3>
      </div>
      <div class="review-steps">
        <div>
          <span>01</span>
          <strong>inventory</strong>
          <p>map the current public-site source and rendered copy.</p>
        </div>
        <div>
          <span>02</span>
          <strong>preview</strong>
          <p>compare current and proposed text without writing.</p>
        </div>
        <div>
          <span>03</span>
          <strong>syscall</strong>
          <p>use NEEDS-ANI only when taste or live authority is required.</p>
        </div>
        <div>
          <span>04</span>
          <strong>write gate</strong>
          <p>save and publish stay unavailable until explicitly authorized.</p>
        </div>
      </div>
      <div class="pill-row">
        <A class="text-link" href="/content">
          inventory
        </A>
        <A class="text-link" href="/content/preview">
          previews
        </A>
        <A class="text-link" href="/needs-ani">
          needs ani
        </A>
      </div>
    </article>
  );
}

export function ContentWriteGate() {
  return (
    <article class="panel-card gate-panel">
      <div>
        <p class="eyebrow">write path status</p>
        <h3>content editing is modeled, not active</h3>
      </div>
      <div class="fact-grid">
        <Fact label="allowed_now" value="inspect current content source refs" />
        <Fact
          label="blocked_now"
          value="save, publish, sync, and outbound posting"
        />
        <Fact
          label="authority_needed"
          value="content operation id plus proof and stop path"
        />
        <Fact
          label="next_slice"
          value="disabled proposal preview, still no writes"
        />
      </div>
    </article>
  );
}

export function ContentPreviewQueue(props: { items: ContentPreviewItem[] }) {
  return (
    <div class="preview-grid">
      <For each={props.items}>
        {(item) => (
          <article class="panel-card preview-card">
            <div class="card-top">
              <div>
                <p class="eyebrow">{item.surface}</p>
                <h3>{item.title}</h3>
                <p class="muted">{item.next_safe_action}</p>
              </div>
              <div class="pill-row">
                <span class="status-pill" data-state={stateKey(item.status)}>
                  {item.status}
                </span>
                <RiskPill risk={item.risk_level} />
              </div>
            </div>

            <div class="preview-diff">
              <div>
                <span>current</span>
                <p>{item.current_value}</p>
              </div>
              <div>
                <span>proposed preview</span>
                <p>{item.proposed_value}</p>
              </div>
            </div>

            <div class="fact-grid">
              <Fact label="source_ref" value={item.source_ref} />
              <Fact label="preview_route" value={item.preview_route} />
              <Fact label="authority_state" value={item.authority_state} />
              <Fact
                label="required_approval_ids"
                value={formatList(item.required_approval_ids)}
              />
              <Fact label="proof_ids" value={formatList(item.proof_ids)} />
              <Fact
                label="blocked_actions"
                value={formatList(item.blocked_actions)}
              />
            </div>
          </article>
        )}
      </For>
    </div>
  );
}

export function ContentPreviewGate() {
  return (
    <article class="panel-card gate-panel">
      <div>
        <p class="eyebrow">preview contract</p>
        <h3>draft proposals have no live effect</h3>
      </div>
      <div class="fact-grid">
        <Fact label="can_do" value="compare current and proposed copy" />
        <Fact label="can_do_next" value="route proposal into NEEDS-ANI later" />
        <Fact label="cannot_do" value="save, publish, send, sync, or deploy" />
        <Fact
          label="required_before_writes"
          value="operation id, authority, proof, and stop path"
        />
      </div>
    </article>
  );
}

export function ApprovalBridgePanel(props: { design: ApprovalBridgeDesign }) {
  return (
    <div class="grid two">
      <article class="panel-card">
        <div class="card-top">
          <div>
            <p class="eyebrow">{props.design.transport}</p>
            <h3>{props.design.title}</h3>
          </div>
          <span class="status-pill" data-state="stale">
            {props.design.status}
          </span>
        </div>
        <div class="fact-grid">
          <For each={props.design.inbound_contract}>
            {(field) => (
              <Fact
                label={field.field}
                value={`${field.source}: ${field.notes}`}
              />
            )}
          </For>
        </div>
      </article>

      <article class="panel-card">
        <div class="card-top">
          <div>
            <p class="eyebrow">interface constraints</p>
            <h3>outbound contract and stops</h3>
          </div>
        </div>
        <div class="fact-grid">
          <For each={props.design.outbound_contract}>
            {(field) => (
              <Fact
                label={field.field}
                value={`${field.source}: ${field.notes}`}
              />
            )}
          </For>
        </div>
        <ul class="stop-list">
          <For each={props.design.hard_stops}>{(stop) => <li>{stop}</li>}</For>
        </ul>
      </article>
    </div>
  );
}

export function DestructiveGrid(props: { gates: DestructiveGate[] }) {
  return (
    <div class="grid destructive-grid">
      <For each={props.gates}>
        {(gate) => (
          <article class="panel-card destructive-card">
            <div class="card-top">
              <div>
                <p class="eyebrow">{gate.area}</p>
                <h3>{gate.title}</h3>
              </div>
              <div class="pill-row">
                <StatusPill state={gate.status} />
                <RiskPill risk={gate.risk_level} />
              </div>
            </div>
            <FlowGrid
              intent={gate.intent}
              authority={gate.authority_state}
              operation={gate.operation_summary}
              proof={gate.proof_ids.join(", ")}
              state={gate.status}
            />
            <div class="fact-grid">
              <Fact
                label="required_approval_ids"
                value={gate.required_approval_ids.join(", ")}
              />
              <Fact
                label="allowed_actions"
                value={gate.allowed_actions.join(", ")}
              />
              <Fact
                label="forbidden_actions"
                value={gate.forbidden_actions.join(", ")}
              />
              <Fact label="evidence_uri" value={gate.evidence_uri} />
              <Fact label="redaction" value={gate.redaction} />
            </div>
            <p class="proof-line">next_safe_action: {gate.next_safe_action}</p>
          </article>
        )}
      </For>
    </div>
  );
}

export function Fact(props: { label: string; value: string }) {
  return (
    <div class="fact">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

function stateKey(state: ControlState | string): string {
  return state.replaceAll(" ", "-");
}
