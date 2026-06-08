/**
 * Tiny WebSocket client that subscribes to a state-worker DO and exposes
 * a Solid signal-friendly callback API. Auto-reconnects with exponential
 * backoff capped at 30s.
 */

export type ConnectionState = "connecting" | "open" | "closed";

export type StateClientOptions<TEvent> = {
  url: string;
  onEvent: (event: TEvent) => void;
  onState?: (state: ConnectionState) => void;
};

export class StateClient<TEvent> {
  private ws: WebSocket | null = null;
  private retryDelay = 500;
  private closed = false;

  constructor(private readonly opts: StateClientOptions<TEvent>) {
    this.connect();
  }

  private connect(): void {
    if (this.closed) return;
    this.opts.onState?.("connecting");
    const ws = new WebSocket(this.opts.url);
    this.ws = ws;

    ws.addEventListener("open", () => {
      this.retryDelay = 500;
      this.opts.onState?.("open");
    });

    ws.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as TEvent;
        this.opts.onEvent(parsed);
      } catch {
        // Ignore malformed frames
      }
    });

    ws.addEventListener("close", () => {
      this.opts.onState?.("closed");
      if (this.closed) return;
      const delay = this.retryDelay;
      this.retryDelay = Math.min(this.retryDelay * 2, 30_000);
      setTimeout(() => this.connect(), delay);
    });

    ws.addEventListener("error", () => {
      // Close fires next; reconnect is handled there.
    });
  }

  send(payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(typeof payload === "string" ? payload : JSON.stringify(payload));
    }
  }

  close(): void {
    this.closed = true;
    this.ws?.close();
  }
}
