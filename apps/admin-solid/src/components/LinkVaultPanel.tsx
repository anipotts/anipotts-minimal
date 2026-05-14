import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { isServer } from "solid-js/web";
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

const STATE_API = (import.meta.env.VITE_PUBLIC_STATE_API as string | undefined) ??
  "https://anipotts-state.anipotts.workers.dev";

export function LinkVaultPanel() {
  const [links, setLinks] = createSignal<Link[]>([]);
  const [conn, setConn] = createSignal<ConnectionState>("connecting");
  const [submitting, setSubmitting] = createSignal(false);
  const [draftUrl, setDraftUrl] = createSignal("");

  let client: StateClient<LinkVaultEvent> | null = null;

  onMount(() => {
    if (isServer) return;
    client = new StateClient<LinkVaultEvent>({
      url: `${STATE_API.replace(/^http/, "ws")}/api/links/ws`,
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

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const url = draftUrl().trim();
    if (!url) return;
    setSubmitting(true);
    try {
      await fetch(`${STATE_API}/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, source: "admin" }),
      });
      setDraftUrl("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>
        <span class="live-dot" data-state={conn()} />
        LinkVault
      </h2>

      <form class="add" onSubmit={submit}>
        <input
          type="url"
          required
          placeholder="https://..."
          value={draftUrl()}
          onInput={(e) => setDraftUrl(e.currentTarget.value)}
        />
        <button type="submit" disabled={submitting()}>
          save
        </button>
      </form>

      <Show
        when={links().length > 0}
        fallback={
          <p class="empty">
            No links yet. Save one above, or text Rudy{" "}
            <span class="muted">"save https://..."</span>.
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
