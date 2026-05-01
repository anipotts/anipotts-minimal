export interface SendEmailBinding {
  send(message: unknown): Promise<void>;
}

export interface OutboundEmail {
  from: string;
  to: string;
  subject: string;
  replyTo?: string;
  text?: string;
  html?: string;
}

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
