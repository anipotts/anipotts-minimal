export interface SendEmailBinding {
  send(message: unknown): Promise<void>;
}

interface OutboundEmailBase {
  from: string;
  to: string;
  subject: string;
  replyTo?: string;
}

export type OutboundEmail = OutboundEmailBase &
  ({ text: string; html?: string } | { html: string; text?: string });

export interface SendOptions {
  maxAttempts?: number;
  backoffBaseMs?: number;
  correlationId?: string;
  perAttemptTimeoutMs?: number;
}

export interface SendResult {
  ok: boolean;
  attempts: number;
  correlationId: string;
  error?: string;
  /**
   * True iff the last attempt timed out locally. The underlying send may
   * still complete in flight, so callers MUST treat this as
   * unknown-delivery: do not retry or requeue.
   */
  timedOut?: boolean;
}
