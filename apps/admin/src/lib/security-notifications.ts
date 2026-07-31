import {
  nowIso,
  type AdminAuthContext,
  type AdminD1Database,
} from "./admin-auth";

type NotificationInput = {
  db: AdminD1Database;
  userId: string;
  eventType: string;
  summary: string;
};

export async function notifyAdminSecurityEvent(
  context: AdminAuthContext,
  input: NotificationInput,
): Promise<void> {
  const id = crypto.randomUUID();
  await input.db
    .prepare(
      `INSERT INTO admin_security_notifications
        (id, event_type, user_id, summary, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, input.eventType, input.userId, input.summary, nowIso())
    .run();

  const env = context.locals.runtime?.env;
  if (env?.ADMIN_SECURITY_ALERTS_ENABLED !== "true") return;
  if (
    !env.RESEND_API_KEY ||
    !env.ADMIN_SECURITY_ALERT_TO ||
    !env.ADMIN_SECURITY_ALERT_FROM
  ) {
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.ADMIN_SECURITY_ALERT_FROM,
        to: [env.ADMIN_SECURITY_ALERT_TO],
        subject: "admin security update",
        text: `${input.summary}\n\nIf this was not you, restore Cloudflare Access and begin owner recovery.`,
      }),
    });
    const result = (await response.json().catch(() => null)) as {
      id?: unknown;
    } | null;
    if (!response.ok) throw new Error(`resend_${response.status}`);
    await input.db
      .prepare(
        `UPDATE admin_security_notifications
         SET sent_at = ?, provider_message_id = ? WHERE id = ?`,
      )
      .bind(
        nowIso(),
        result && typeof result.id === "string" ? result.id : null,
        id,
      )
      .run();
  } catch (error) {
    await input.db
      .prepare(
        `UPDATE admin_security_notifications
         SET failed_at = ?, failure_code = ? WHERE id = ?`,
      )
      .bind(
        nowIso(),
        error instanceof Error ? error.message.slice(0, 80) : "send_failed",
        id,
      )
      .run();
  }
}
