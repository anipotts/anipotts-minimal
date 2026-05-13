import { buildMime, parseAddress } from "./mime";
import type {
  OutboundEmail,
  SendEmailBinding,
  SendOptions,
  SendResult,
} from "./types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function log(fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ event: "email.send", ...fields }));
}

export async function sendViaBinding(
  binding: SendEmailBinding,
  msg: OutboundEmail,
  opts: SendOptions = {},
): Promise<SendResult> {
  const maxAttempts = opts.maxAttempts ?? 1;
  const backoffBaseMs = opts.backoffBaseMs ?? 1000;
  const perAttemptTimeoutMs = opts.perAttemptTimeoutMs ?? 10_000;
  const correlationId = opts.correlationId ?? crypto.randomUUID();

  const { EmailMessage } = (await import(
    /* webpackIgnore: true */
    // @ts-expect-error workerd built-in, no node types
    "cloudflare:email"
  )) as {
    EmailMessage: new (from: string, to: string, raw: string) => unknown;
  };

  const raw = buildMime(msg);
  const envelopeFrom = parseAddress(msg.from).addr;

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const send = binding.send(new EmailMessage(envelopeFrom, msg.to, raw));
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () =>
            reject(new Error(`send timed out after ${perAttemptTimeoutMs}ms`)),
          perAttemptTimeoutMs,
        );
      });
      await Promise.race([send, timeout]);
      clearTimeout(timeoutId);
      log({
        ok: true,
        attempt,
        correlationId,
        subject: msg.subject,
        to: msg.to,
      });
      return { ok: true, attempts: attempt, correlationId };
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = e instanceof Error ? e.message : String(e);
      log({
        ok: false,
        attempt,
        correlationId,
        subject: msg.subject,
        to: msg.to,
        error: lastError,
      });
      if (attempt < maxAttempts) {
        await sleep(backoffBaseMs * Math.pow(4, attempt - 1));
      }
    }
  }

  return {
    ok: false,
    attempts: maxAttempts,
    correlationId,
    error: lastError ?? "send failed",
  };
}
