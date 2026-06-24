import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import type { JSX } from "solid-js";
import type {
  AuthorityCard,
  ControlState,
  DestructiveGate,
  HandoffCard,
  OperationCard,
  ProofCard,
  RepoCard,
  RiskLevel,
  WorkCard,
} from "~/data/control-plane";
import { topStrip } from "~/data/control-plane";

const navItems = [
  { href: "/", label: "overview" },
  { href: "/mutations", label: "mutations" },
  { href: "/fleet", label: "fleet" },
  { href: "/repos", label: "repos" },
  { href: "/handoffs", label: "handoffs" },
  { href: "/ops/destructive", label: "destructive ops" },
];

export function ControlPlaneLayout(props: {
  title: string;
  deck: string;
  children: JSX.Element;
}) {
  return (
    <main>
      <header class="app-header">
        <div>
          <p class="eyebrow">admin.anipotts.com</p>
          <h1>{props.title}</h1>
          <p class="lede">{props.deck}</p>
        </div>
        <div class="model-chip">intent / authority / operation / proof / state</div>
      </header>

      <nav class="nav-row" aria-label="admin control-plane sections">
        <For each={navItems}>
          {(item) => (
            <A href={item.href} end={item.href === "/"}>
              {item.label}
            </A>
          )}
        </For>
      </nav>

      <TopStrip />

      <div class="page-stack">{props.children}</div>
    </main>
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
            <Fact label="required_approval_ids" value={row.required_approval_ids.join(", ")} />
            <Fact label="allowed_actions" value={row.allowed_actions.join(", ")} />
            <Fact label="forbidden_actions" value={row.forbidden_actions.join(", ")} />
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
            <p class="proof-line">next_safe_action: {operation.next_safe_action}</p>
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
            <Fact label="dirty_tracked" value={formatList(repo.dirty_tracked)} />
            <Fact label="untracked_count" value={String(repo.untracked_count)} />
            <Fact label="deploy_impact" value={repo.deploy_impact} />
            <Fact label="proof_ids" value={repo.proof_ids.join(", ")} />
            <p class="proof-line">next_safe_action: {repo.next_safe_action}</p>
          </article>
        )}
      </For>
    </div>
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
            <Fact label="absorbed_at" value={handoff.absorbed_at ?? "not absorbed"} />
            <Fact label="target_owner" value={handoff.target_owner} />
            <Fact label="proof_ids" value={handoff.proof_ids.join(", ")} />
            <p class="proof-line">next_safe_action: {handoff.next_safe_action}</p>
          </article>
        )}
      </For>
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
              <Fact label="required_approval_ids" value={gate.required_approval_ids.join(", ")} />
              <Fact label="allowed_actions" value={gate.allowed_actions.join(", ")} />
              <Fact label="forbidden_actions" value={gate.forbidden_actions.join(", ")} />
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

function stateKey(state: ControlState): string {
  return state.replaceAll(" ", "-");
}
