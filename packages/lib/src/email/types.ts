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
}

export interface SendResult {
  ok: boolean;
  attempts: number;
  correlationId: string;
  error?: string;
}
