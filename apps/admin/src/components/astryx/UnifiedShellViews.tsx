import React from "react";
import type {
  AdminControlSnapshot,
  AdminProjectState,
  AdminTaskLineage,
  AdminTaskState,
} from "@anipotts/lib/admin-control";
import { adminControlHref } from "../../data/admin-control-source";

const CLOSED_LIFECYCLES = new Set(["archived", "complete"]);

const lifeSurfaces = [
  {
    href: "/life/health",
    title: "health",
    status: "status only",
    description: "status unavailable",
  },
  {
    href: "/life/aesthetics",
    title: "aesthetics",
    status: "references",
    description: "no saved references",
  },
] as const;

const aestheticsSurfaces = [
  "wardrobe",
  "outfits",
  "looks",
  "references",
  "personal style",
] as const;

const systemSurfaces = [
  {
    href: "/system/security",
    title: "security",
    detail: "password, passkeys, sessions, tokens, and audit",
  },
  {
    href: "/proof",
    title: "proof and auth",
    detail: "passkey, route, and operation proof",
  },
  {
    href: "/deploys",
    title: "deploys",
    detail: "scoped target map and deployment proof",
  },
  {
    href: "/repos",
    title: "repos",
    detail: "branch state and drift detail",
  },
  {
    href: "/handoffs",
    title: "handoffs",
    detail: "freshness and absorption status",
  },
  {
    href: "/mutations",
    title: "mutations",
    detail: "gated operation state",
  },
  {
    href: "/ops/destructive",
    title: "destructive ops",
    detail: "visible audit boundary",
  },
] as const;

type WorkViewProps = {
  snapshot: AdminControlSnapshot;
  fixtureMode?: boolean;
};

export function CareerView({ snapshot, fixtureMode = false }: WorkViewProps) {
  const projects = snapshot.projections.project_states.filter(
    (project) => project.domain === "career",
  );
  const tasks = snapshot.projections.task_states.filter((task) =>
    projects.some((project) => project.project_id === task.project_ref),
  );
  const openTasks = tasks.filter(
    (task) => !CLOSED_LIFECYCLES.has(task.lifecycle),
  );
  return (
    <>
      <section className="meta-strip" aria-label="career projection state">
        <span>read only</span>
        <span>{snapshot.source_mode}</span>
        <span>{projects.length} projects</span>
        <span>{openTasks.length} open tasks</span>
      </section>
      <section className="projection-board work-project-board">
        <div className="section-head">
          <div>
            <p>career</p>
            <h2>Current</h2>
          </div>
          <span>{projects.length} active</span>
        </div>
        <div className="work-project-grid">
          {projects.map((project) => (
            <ProjectCard
              fixtureMode={fixtureMode}
              key={project.project_id}
              project={project}
              taskCount={
                tasks.filter((task) => task.project_ref === project.project_id)
                  .length
              }
            />
          ))}
        </div>
      </section>
      <a className="button secondary" href="/career/job-search">
        open job search
      </a>
    </>
  );
}

export function JobSearchView({
  snapshot,
  fixtureMode = false,
}: WorkViewProps) {
  const career = snapshot.projections.career_snapshots[0];
  const targets = career
    ? snapshot.projections.career_targets.filter(
        (target) => target.snapshot_ref === career.snapshot_id,
      )
    : [];
  const project = snapshot.projections.project_states.find(
    (item) => item.project_key === "job-search",
  );
  const tasks = project
    ? snapshot.projections.task_states.filter(
        (task) => task.project_ref === project.project_id,
      )
    : [];
  const lineage = new Set(tasks.map((task) => task.task_id));
  const relatedLineage = snapshot.projections.task_lineage.filter((row) =>
    lineage.has(row.task_ref),
  );

  return (
    <>
      <section className="meta-strip" aria-label="job search source state">
        <span>read only</span>
        <span>{snapshot.source_mode}</span>
        <span>{career?.stale ? "stale" : "current"}</span>
        <span>{targets.length} targets</span>
        <span>{tasks.length} related tasks</span>
      </section>
      {!career ? (
        <section className="notice">
          <strong>job search unavailable</strong>
        </section>
      ) : (
        <>
          <section className="table-card work-detail-card">
            <div className="section-head">
              <div>
                <p>current focus</p>
                <h2>{career.current_focus}</h2>
              </div>
              <WorkBadge value={career.readiness} />
            </div>
            <div className="work-next-action">
              <span>next action</span>
              <strong>{career.next_action}</strong>
            </div>
            <dl className="work-detail-grid">
              <Detail label="generated" value={career.generated_at} />
              <Detail
                label="commitments"
                value={career.commitments.join(", ")}
              />
              <Detail
                label="contradictions"
                value={career.contradictions.join(", ") || "none"}
              />
              <Detail
                label="owner"
                value={project?.owner_chief ?? "chief/jobs"}
              />
            </dl>
          </section>
          <section className="table-card work-task-board">
            <div className="section-head">
              <div>
                <p>sources</p>
                <h2>Freshness</h2>
              </div>
              <span>{career.source_status.length} sources</span>
            </div>
            <div className="work-task-list">
              {career.source_status.map((source) => (
                <article className="work-task-row" key={source.source}>
                  <div className="work-task-heading">
                    <div>
                      <span>{source.observed_at ?? "not refreshed"}</span>
                      <h3>{source.source}</h3>
                    </div>
                    <WorkBadge value={source.status} />
                  </div>
                  <p>{source.summary}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="table-card work-task-board">
            <div className="section-head">
              <div>
                <p>targets</p>
                <h2>Active search</h2>
              </div>
              <span>{targets.length} rows</span>
            </div>
            <div className="work-task-list">
              {targets.map((target) => (
                <article className="work-task-row" key={target.target_id}>
                  <div className="work-task-heading">
                    <div>
                      <span>{target.company}</span>
                      <h3>{target.role}</h3>
                    </div>
                    <WorkBadge value={target.stage} />
                  </div>
                  <div className="work-next-action">
                    <span>next action</span>
                    <strong>{target.next_action}</strong>
                  </div>
                  {target.source_link_refs.length > 0 ? (
                    <div className="work-task-footer">
                      {target.source_link_refs.map((ref) => (
                        <a
                          className="button ghost"
                          href={`/api/admin/source/${encodeURIComponent(ref)}`}
                          key={ref}
                        >
                          open source
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
          <details className="table-card work-history">
            <summary>
              {tasks.length} related tasks / {relatedLineage.length} lineage
              rows
            </summary>
            <div className="work-task-list">
              {tasks.map((task) => (
                <TaskRow
                  fixtureMode={fixtureMode}
                  key={task.task_id}
                  task={task}
                />
              ))}
            </div>
          </details>
          {tasks.length > 1 ? (
            <section className="notice">
              <strong>convergence proposal</strong>
              <span>
                keep the current chief/jobs task canonical; preserve related
                tasks as lineage until merge and archive controls are enabled.
              </span>
            </section>
          ) : null}
        </>
      )}
    </>
  );
}

export function WorkView({ snapshot, fixtureMode = false }: WorkViewProps) {
  const projects = snapshot.projections.project_states;
  const tasks = snapshot.projections.task_states;
  const projectIds = new Set(projects.map((project) => project.project_id));
  const matchedTasks = tasks.filter((task) => projectIds.has(task.project_ref));
  const looseTasks = tasks.filter((task) => !projectIds.has(task.project_ref));
  const openTasks = matchedTasks.filter(
    (task) => !CLOSED_LIFECYCLES.has(task.lifecycle),
  );
  const historyTasks = matchedTasks.filter((task) =>
    CLOSED_LIFECYCLES.has(task.lifecycle),
  );
  const activeProjects = projects.filter((project) =>
    tasks.some((task) => task.project_ref === project.project_id),
  );
  const observedProjects = projects.filter(
    (project) => !tasks.some((task) => task.project_ref === project.project_id),
  );

  return (
    <>
      <section className="meta-strip" aria-label="work projection state">
        <span>read only</span>
        <span>{snapshot.source_mode}</span>
        <span>{projects.length} projects</span>
        <span>{openTasks.length} open tasks</span>
        <span>{snapshot.projections.task_lineage.length} lineage rows</span>
      </section>

      {snapshot.source_mode !== "fixture" && snapshot.errors.length > 0 ? (
        <section className="notice work-source-notice" aria-live="polite">
          <strong>work source unavailable</strong>
          <span>{snapshot.errors.length} projection reads failed.</span>
        </section>
      ) : null}

      <section className="projection-board work-project-board">
        <div className="section-head">
          <div>
            <p>projects</p>
            <h2>Active work</h2>
          </div>
          <span>{activeProjects.length} active</span>
        </div>

        {activeProjects.length > 0 ? (
          <div className="work-project-grid">
            {activeProjects.map((project) => (
              <ProjectCard
                fixtureMode={fixtureMode}
                key={project.project_id}
                project={project}
                taskCount={
                  tasks.filter(
                    (task) => task.project_ref === project.project_id,
                  ).length
                }
              />
            ))}
          </div>
        ) : (
          <div className="projection-empty">
            <span>No active projects.</span>
          </div>
        )}

        {observedProjects.length > 0 ? (
          <details className="work-collapsed-list">
            <summary>{observedProjects.length} observed projects</summary>
            <div className="work-observed-grid">
              {observedProjects.map((project) => (
                <ProjectCard
                  compact
                  fixtureMode={fixtureMode}
                  key={project.project_id}
                  project={project}
                  taskCount={0}
                />
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section className="table-card work-task-board">
        <div className="section-head">
          <div>
            <p>tasks</p>
            <h2>Open tasks</h2>
          </div>
          <span>{openTasks.length} open</span>
        </div>
        <div className="work-task-list">
          {openTasks.length > 0 ? (
            openTasks.map((task) => (
              <TaskRow
                fixtureMode={fixtureMode}
                key={task.task_id}
                task={task}
              />
            ))
          ) : (
            <div className="projection-empty">
              <span>No active tasks.</span>
            </div>
          )}
        </div>
      </section>

      {historyTasks.length > 0 ? (
        <details className="table-card work-history">
          <summary>{historyTasks.length} completed and history rows</summary>
          <div className="work-task-list">
            {historyTasks.map((task) => (
              <TaskRow
                fixtureMode={fixtureMode}
                key={task.task_id}
                task={task}
              />
            ))}
          </div>
        </details>
      ) : null}

      {looseTasks.length > 0 ? (
        <details className="table-card work-history">
          <summary>{looseTasks.length} loose or unmatched tasks</summary>
          <div className="work-task-list">
            {looseTasks.map((task) => (
              <TaskRow
                fixtureMode={fixtureMode}
                key={task.task_id}
                task={task}
              />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

type ProjectDetailViewProps = WorkViewProps & {
  project: AdminProjectState;
};

export function ProjectDetailView({
  snapshot,
  project,
  fixtureMode = false,
}: ProjectDetailViewProps) {
  const tasks = snapshot.projections.task_states.filter(
    (task) => task.project_ref === project.project_id,
  );
  const openTasks = tasks.filter(
    (task) => !CLOSED_LIFECYCLES.has(task.lifecycle),
  );
  const historyTasks = tasks.filter((task) =>
    CLOSED_LIFECYCLES.has(task.lifecycle),
  );

  return (
    <>
      <section className="meta-strip" aria-label="project state">
        <span>{project.lifecycle}</span>
        <span>{project.attention_kind}</span>
        <span>{project.canonical_host_role}</span>
        <span>{tasks.length} tasks</span>
      </section>

      <section className="table-card work-detail-card">
        <div className="section-head">
          <div>
            <p>{project.project_key}</p>
            <h2>{project.display_name}</h2>
          </div>
          <WorkBadge value={project.attention_kind} />
        </div>
        <dl className="work-detail-grid">
          <Detail label="owner" value={project.owner_chief} />
          <Detail label="domain" value={project.domain} />
          <Detail label="repository" value={project.repository} />
          <Detail label="pro" value={project.pro_path} />
          <Detail label="mini" value={project.mini_path} />
          <Detail label="entity" value={project.entity_ref} />
        </dl>
      </section>

      <section className="table-card work-task-board">
        <div className="section-head">
          <div>
            <p>tasks</p>
            <h2>Open tasks</h2>
          </div>
          <span>{openTasks.length} open</span>
        </div>
        <div className="work-task-list">
          {openTasks.length > 0 ? (
            openTasks.map((task) => (
              <TaskRow
                fixtureMode={fixtureMode}
                key={task.task_id}
                task={task}
              />
            ))
          ) : (
            <div className="projection-empty">
              <span>No active tasks.</span>
            </div>
          )}
        </div>
      </section>

      {historyTasks.length > 0 ? (
        <details className="table-card work-history">
          <summary>{historyTasks.length} completed and history rows</summary>
          <div className="work-task-list">
            {historyTasks.map((task) => (
              <TaskRow
                fixtureMode={fixtureMode}
                key={task.task_id}
                task={task}
              />
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}

type TaskDetailViewProps = WorkViewProps & {
  task: AdminTaskState;
  lineage: AdminTaskLineage[];
};

export function TaskDetailView({
  snapshot,
  task,
  lineage,
  fixtureMode = false,
}: TaskDetailViewProps) {
  const project = snapshot.projections.project_states.find(
    (item) => item.project_id === task.project_ref,
  );

  return (
    <>
      <section className="meta-strip" aria-label="task state">
        <span>{task.lifecycle}</span>
        <span>{task.attention_kind}</span>
        <span>{task.machine}</span>
        <span>{task.native_runtime_status}</span>
      </section>

      <section className="table-card work-detail-card">
        <div className="section-head">
          <div>
            <p>{task.task_id}</p>
            <h2>{task.goal}</h2>
          </div>
          <WorkBadge value={task.attention_kind} />
        </div>

        <div className="work-task-summary">
          <p>{task.current_summary}</p>
          <div className="work-next-action">
            <span>next action</span>
            <strong>{task.next_action}</strong>
          </div>
        </div>

        <dl className="work-detail-grid">
          <Detail label="host" value={task.host} />
          <Detail label="runtime" value={task.native_runtime_status} />
          <Detail label="cwd" value={task.cwd} />
          <Detail label="agent" value={task.agent_source} />
          <Detail label="updated" value={task.updated_at} />
          <Detail label="completed" value={task.completed_at} />
        </dl>

        {project ? (
          <a
            className="button secondary"
            href={adminControlHref(
              `/projects/${encodeURIComponent(project.project_key)}`,
              fixtureMode,
            )}
          >
            open {project.display_name}
          </a>
        ) : null}
      </section>

      <section className="table-card work-proof-card">
        <div className="section-head">
          <div>
            <p>proof</p>
            <h2>References</h2>
          </div>
          <span>{task.proof_refs.length}</span>
        </div>
        <ReferenceList emptyLabel="No proof refs." values={task.proof_refs} />
      </section>

      <section className="table-card work-lineage-card">
        <div className="section-head">
          <div>
            <p>history</p>
            <h2>Task lineage</h2>
          </div>
          <span>{lineage.length} rows</span>
        </div>
        {lineage.length > 0 ? (
          <div className="work-lineage-list">
            {lineage.map((row) => {
              const relatedTask = snapshot.projections.task_states.find(
                (item) => item.task_id === row.task_ref,
              );
              return (
                <a
                  href={adminControlHref(
                    `/tasks/${encodeURIComponent(row.task_ref)}`,
                    fixtureMode,
                  )}
                  key={row.lineage_id}
                >
                  <span>{formatLabel(row.relation)}</span>
                  <strong>{relatedTask?.goal ?? row.task_ref}</strong>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="projection-empty">
            <span>No lineage rows.</span>
          </div>
        )}
      </section>
    </>
  );
}

export function FleetView({ snapshot, fixtureMode = false }: WorkViewProps) {
  const rows = snapshot.projections.fleet_status;

  return (
    <>
      <section className="meta-strip" aria-label="fleet projection state">
        <span>read only</span>
        <span>{snapshot.source_mode}</span>
        <span>{rows.length} states</span>
      </section>
      {snapshot.source_mode !== "fixture" && snapshot.errors.length > 0 ? (
        <section className="notice work-source-notice">
          <strong>fleet source unavailable</strong>
          <span>{snapshot.errors.length} projection reads failed.</span>
        </section>
      ) : null}
      <section className="table-card work-task-board">
        <div className="section-head">
          <div>
            <p>fleet</p>
            <h2>Runtime and cleanup</h2>
          </div>
          <span>{rows.length} states</span>
        </div>
        <div className="work-task-list">
          {rows.length > 0 ? (
            rows.map((row) => (
              <article className="work-task-row" key={row.subject_id}>
                <div className="work-task-heading">
                  <div>
                    <span>{formatLabel(row.kind)}</span>
                    <h3>{row.title}</h3>
                  </div>
                  <WorkBadge value={row.status} />
                </div>
                <p>{row.summary}</p>
                <div className="work-task-meta">
                  <span>{row.owner}</span>
                  <span>{row.updated_at ?? "unobserved"}</span>
                </div>
                {row.title.includes("personal") ? (
                  <a
                    className="button ghost"
                    href={adminControlHref(
                      "/projects/personal-system-cleanup",
                      fixtureMode,
                    )}
                  >
                    open work
                  </a>
                ) : null}
              </article>
            ))
          ) : (
            <div className="projection-empty">
              <span>No fleet state.</span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ProjectCard({
  project,
  taskCount,
  fixtureMode,
  compact = false,
}: {
  project: AdminProjectState;
  taskCount: number;
  fixtureMode: boolean;
  compact?: boolean;
}) {
  return (
    <a
      className={`work-project-card${compact ? " is-compact" : ""}`}
      href={adminControlHref(
        `/projects/${encodeURIComponent(project.project_key)}`,
        fixtureMode,
      )}
    >
      <div className="work-project-heading">
        <span>{project.owner_chief}</span>
        <WorkBadge value={project.attention_kind} />
      </div>
      <h3>{project.display_name}</h3>
      <div className="work-project-meta">
        <span>{formatLabel(project.lifecycle)}</span>
        <span>{formatLabel(project.canonical_host_role)}</span>
        <span>{taskCount} tasks</span>
      </div>
    </a>
  );
}

function TaskRow({
  task,
  fixtureMode,
}: {
  task: AdminTaskState;
  fixtureMode: boolean;
}) {
  return (
    <article className="work-task-row">
      <div className="work-task-heading">
        <div>
          <span>{task.project_ref}</span>
          <h3>{task.goal}</h3>
        </div>
        <div className="work-task-badges">
          <WorkBadge value={task.attention_kind} />
          <WorkBadge value={task.native_runtime_status} />
        </div>
      </div>
      <p>{task.current_summary}</p>
      <div className="work-task-meta">
        <span>{task.machine}</span>
        <span>{task.host}</span>
        <span>{formatLabel(task.lifecycle)}</span>
      </div>
      <div className="work-next-action">
        <span>next action</span>
        <strong>{task.next_action}</strong>
      </div>
      <div className="work-task-footer">
        <ReferenceList emptyLabel="No proof refs." values={task.proof_refs} />
        <a
          className="button ghost"
          href={adminControlHref(
            `/tasks/${encodeURIComponent(task.task_id)}`,
            fixtureMode,
          )}
        >
          details
        </a>
      </div>
    </article>
  );
}

function WorkBadge({ value }: { value: string }) {
  return <span className="work-badge">{formatLabel(value)}</span>;
}

function ReferenceList({
  values,
  emptyLabel,
}: {
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div className="work-reference-list">
      {values.length > 0 ? (
        values.map((value) => <code key={value}>{value}</code>)
      ) : (
        <span>{emptyLabel}</span>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || "none"}</dd>
    </div>
  );
}

function formatLabel(value: string): string {
  return value.replaceAll("_", " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function LifeView() {
  return (
    <section className="quiet-overview" aria-label="life overview">
      <div className="quiet-intro">
        <p>overview</p>
        <h2>Status and references.</h2>
        <span>Health, wardrobe, outfits, looks, references, and style.</span>
      </div>

      <div className="quiet-route-list">
        {lifeSurfaces.map((surface) => (
          <a href={surface.href} className="quiet-route-row" key={surface.href}>
            <div>
              <span>{surface.status}</span>
              <strong>{surface.title}</strong>
            </div>
            <p>{surface.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

export function HealthView() {
  return (
    <>
      <section className="meta-strip" aria-label="health route policy">
        <span>status only</span>
        <span>unavailable</span>
      </section>

      <section className="quiet-status-panel">
        <div>
          <p>health</p>
          <h2>Health status unavailable.</h2>
        </div>
        <a className="button secondary" href="/life">
          back to life
        </a>
      </section>
    </>
  );
}

export function AestheticsView() {
  return (
    <>
      <section className="meta-strip" aria-label="aesthetics state">
        <span>read only</span>
        <span>empty</span>
      </section>

      <section className="aesthetics-shell">
        <div className="quiet-intro compact">
          <p>references</p>
          <h2>No saved references.</h2>
        </div>

        <div className="aesthetics-list">
          {aestheticsSurfaces.map((surface) => (
            <article key={surface}>
              <strong>{surface}</strong>
              <span>empty</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export function SystemView() {
  return (
    <>
      <section className="meta-strip" aria-label="system overview state">
        <span>read only</span>
        <span>Access on</span>
        <span>mutations gated</span>
      </section>

      <nav className="system-route-grid" aria-label="system routes">
        {systemSurfaces.map((surface) => (
          <a href={surface.href} key={surface.href}>
            <strong>{surface.title}</strong>
            <span>{surface.detail}</span>
          </a>
        ))}
      </nav>

      <div className="notice system-inbox-note">
        <a href="/inbox?category=system">Open the system inbox filter.</a>
      </div>
    </>
  );
}
