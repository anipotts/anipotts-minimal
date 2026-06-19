"use client";

import type { NewsletterContent } from "@anipotts/types";
import { Field } from "./site-content-editor-fields";

export function NewsletterForm({
  content,
  update,
}: {
  content: NewsletterContent;
  update: (patch: Partial<NewsletterContent>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="headline">
        <input
          value={content.headline}
          onChange={(event) => update({ headline: event.target.value })}
          className="admin-input px-3 py-2 text-[13px] text-zinc-100"
        />
      </Field>
      <Field label="deck">
        <textarea
          value={content.deck}
          onChange={(event) => update({ deck: event.target.value })}
          rows={4}
          className="admin-editor resize-y px-3 py-2 text-[13px] text-zinc-200"
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="button">
          <input
            value={content.cta_label}
            onChange={(event) => update({ cta_label: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
        <Field label="newsletter url">
          <input
            value={content.buttondown_url}
            onChange={(event) => update({ buttondown_url: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="success message">
          <input
            value={content.success_message}
            onChange={(event) =>
              update({ success_message: event.target.value })
            }
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
        <Field label="error message">
          <input
            value={content.error_message}
            onChange={(event) => update({ error_message: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="sender">
          <input
            value={content.sender_name}
            onChange={(event) => update({ sender_name: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        <Field label="sender email">
          <input
            value={content.sender_email}
            onChange={(event) => update({ sender_email: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
        <Field label="reply-to">
          <input
            value={content.reply_to}
            onChange={(event) => update({ reply_to: event.target.value })}
            className="admin-input px-3 py-2 text-[12px] text-zinc-200"
          />
        </Field>
      </div>
      <Field label="footer / legal">
        <textarea
          value={content.footer_text}
          onChange={(event) => update({ footer_text: event.target.value })}
          rows={5}
          className="admin-editor resize-y px-3 py-2 text-[13px] text-zinc-200"
        />
      </Field>
    </div>
  );
}
