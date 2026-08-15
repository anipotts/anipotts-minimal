import { useMemo } from "react";
import {
  Table,
  pixel,
  proportional,
  type TableColumn,
} from "@astryxdesign/core/Table";
import { ArrowSquareOutIcon, MagnifyingGlassIcon } from "../admin-icons";
import { SourceMark } from "../SourceMark";
import type {
  OperatorTaskState,
  OperatorWorkLane,
} from "../../data/operator-work";
import { operatorTaskDisplay } from "../../data/operator-work-view";

type WorkRow = OperatorTaskState &
  Record<string, unknown> & {
    lane: OperatorWorkLane;
    semantic_reference_id: string;
    source_state: "verified" | "stale";
  };

type Props = {
  rows: WorkRow[];
};

const laneLabel: Record<OperatorWorkLane, string> = {
  foreground: "working",
  background: "background",
  waiting: "waiting",
  recently_completed: "completed",
};

const displayTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const stateLabel = (row: WorkRow) =>
  row.source_state === "verified" ? laneLabel[row.lane] : "last verified";

const stateClass = (row: WorkRow) =>
  row.source_state === "verified" ? row.operator_state : "unknown";

export function OperatorWorkTable({ rows }: Props) {
  const columns = useMemo<Array<TableColumn<WorkRow>>>(
    () => [
      {
        key: "canonical_title",
        header: "Work",
        width: proportional(1.45),
        renderCell: (row) => (
          <div className="quiet-work-identity">
            <SourceMark provider={row.provider} compact />
            <span>
              <strong>{row.canonical_title}</strong>
              <small>{row.project_label}</small>
            </span>
          </div>
        ),
      },
      {
        key: "operator_state",
        header: "State",
        width: pixel(132),
        renderCell: (row) => (
          <div className="quiet-work-state">
            <span
              className={`quiet-state-dot is-${stateClass(row)}`}
              aria-hidden="true"
            />
            <span>
              <strong>{stateLabel(row)}</strong>
              <small>
                {row.source_state === "verified"
                  ? row.runtime_state
                  : "source stale"}
              </small>
            </span>
          </div>
        ),
      },
      {
        key: "bounded_goal",
        header: "Now",
        width: proportional(2),
        renderCell: (row) => (
          <div className="quiet-work-now">
            <strong>{operatorTaskDisplay(row).bounded_goal}</strong>
            <small>{operatorTaskDisplay(row).next_action}</small>
          </div>
        ),
      },
      {
        key: "last_observed_at",
        header: "Updated",
        width: pixel(132),
        renderCell: (row) => (
          <div className="quiet-work-time">
            <time dateTime={row.last_observed_at}>
              {displayTime(row.last_observed_at)}
            </time>
            <small>{row.host}</small>
          </div>
        ),
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        width: pixel(92),
        align: "end",
        resizable: false,
        renderCell: (row) => (
          <div className="quiet-row-actions">
            {row.attention_ref ? (
              <a
                className="quiet-icon-action"
                href={`/?item=${encodeURIComponent(row.attention_ref)}`}
                aria-label={`open linked Inbox item for ${row.canonical_title}`}
                title="open linked Inbox item"
              >
                <ArrowSquareOutIcon size={17} aria-hidden="true" />
              </a>
            ) : null}
            <button
              className="quiet-icon-action"
              type="button"
              data-semantic-open={row.semantic_reference_id}
              aria-label={`inspect ${row.canonical_title}`}
              title="inspect"
            >
              <MagnifyingGlassIcon size={17} aria-hidden="true" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="quiet-work-table" data-operator-work-table>
        <Table
          data={rows}
          columns={columns}
          idKey="task_id"
          density="compact"
          dividers="rows"
          hasHover
          verticalAlign="middle"
          textOverflow="truncate"
        />
      </div>
      <div className="quiet-work-stack">
        {rows.map((row) => (
          <article key={row.task_id} id={`task-${row.task_id}`}>
            <header>
              <SourceMark provider={row.provider} compact />
              <strong>{row.canonical_title}</strong>
              <span className={`quiet-state-dot is-${stateClass(row)}`} />
              <span>{stateLabel(row)}</span>
            </header>
            <p>{operatorTaskDisplay(row).bounded_goal}</p>
            <small>{operatorTaskDisplay(row).next_action}</small>
            <footer>
              <time dateTime={row.last_observed_at}>
                {displayTime(row.last_observed_at)}
              </time>
              <button
                type="button"
                data-semantic-open={row.semantic_reference_id}
                aria-label={`inspect ${row.canonical_title}`}
              >
                inspect
              </button>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
