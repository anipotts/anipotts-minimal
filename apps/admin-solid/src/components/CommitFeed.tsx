import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { getStateWs } from "~/lib/config";
import { StateClient, type ConnectionState } from "~/lib/state-client";

type Commit = {
  sha: string;
  repo: string;
  subject: string;
  author: string;
  ts: string;
  branch?: string;
};

type CodeStatsEvent =
  | { type: "snapshot"; commits: Commit[] }
  | { type: "commit.added"; commit: Commit };

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommitFeed() {
  const [commits, setCommits] = createSignal<Commit[]>([]);
  const [conn, setConn] = createSignal<ConnectionState>("connecting");

  let client: StateClient<CodeStatsEvent> | null = null;

  onMount(() => {
    if (isServer) return;
    client = new StateClient<CodeStatsEvent>({
      url: getStateWs("/api/commits/ws"),
      onState: setConn,
      onEvent: (event) => {
        if (event.type === "snapshot") setCommits(event.commits);
        if (event.type === "commit.added") {
          setCommits((prev) => [
            event.commit,
            ...prev.filter((c) => c.sha !== event.commit.sha),
          ]);
        }
      },
    });
  });

  onCleanup(() => client?.close());

  return (
    <section class="feed-panel">
      <h2 class="panel-title">
        <span class="live-dot" data-state={conn()} />
        codestats
      </h2>

      <Show
        when={commits().length > 0}
        fallback={
          <p class="empty">
            No commits yet. Mini publisher posts here when it sees new commits in{" "}
            <span class="muted">~/Code/projects/**</span>.
          </p>
        }
      >
        <ul class="commits">
          <For each={commits()}>
            {(commit) => (
              <li>
                <div class="commit-line">
                  <span class="commit-sha">{commit.sha.slice(0, 7)}</span>
                  <span class="commit-subject">{commit.subject}</span>
                </div>
                <span class="muted">
                  {commit.repo}
                  {commit.branch ? ` · ${commit.branch}` : ""} · {formatRelative(commit.ts)}
                </span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}
