import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { isServer } from "solid-js/web";
import { getStateWs } from "~/lib/config";
import { StateClient, type ConnectionState } from "~/lib/state-client";

type Link = {
  id: string;
  url: string;
  title?: string;
  tag?: string;
  source?: string;
  savedAt: string;
};

type LinkVaultEvent =
  | { type: "snapshot"; links: Link[] }
  | { type: "link.added"; link: Link }
  | { type: "link.removed"; id: string };

export function LinkVaultPanel() {
  const [links, setLinks] = createSignal<Link[]>([]);
  const [conn, setConn] = createSignal<ConnectionState>("connecting");

  let client: StateClient<LinkVaultEvent> | null = null;

  onMount(() => {
    if (isServer) return;
    client = new StateClient<LinkVaultEvent>({
      url: getStateWs("/api/links/ws"),
      onState: setConn,
      onEvent: (event) => {
        if (event.type === "snapshot") setLinks(event.links);
        if (event.type === "link.added") {
          setLinks((prev) => [event.link, ...prev.filter((l) => l.id !== event.link.id)]);
        }
        if (event.type === "link.removed") {
          setLinks((prev) => prev.filter((l) => l.id !== event.id));
        }
      },
    });
  });

  onCleanup(() => client?.close());

  return (
    <section class="feed-panel">
      <h2 class="panel-title">
        <span class="live-dot" data-state={conn()} />
        linkvault
      </h2>
      <p class="panel-note">
        read-only for now. writes move behind an authenticated server action in
        the next pass.
      </p>

      <Show
        when={links().length > 0}
        fallback={
          <p class="empty">
            No links yet. Publisher writes require STATE_PUBLISH_KEY.
          </p>
        }
      >
        <ul class="links">
          <For each={links()}>
            {(link) => (
              <li>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title ?? link.url}
                </a>
                <span class="muted">
                  {new Date(link.savedAt).toLocaleString()} · {link.source ?? "manual"}
                  {link.tag ? ` · ${link.tag}` : ""}
                </span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}
