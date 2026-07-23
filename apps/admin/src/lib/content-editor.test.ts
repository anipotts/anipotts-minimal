import { describe, expect, it } from "vitest";
import {
  publishableDraftError,
  type ContentEditorPayload,
  type PublishableDraftContract,
} from "./content-editor";

const payload: ContentEditorPayload = {
  kind: "writing",
  page_key: "writing:security-with-less-friction",
  title: "security with less friction",
  slug: "security-with-less-friction",
  summary: "a test draft",
  tags: ["security"],
  body: "body",
  visibility: "published",
  date: "2026-07-23",
  updated_by: "ani",
  updated_at: "2026-07-23T19:00:00.000Z",
  content: {},
};

const draft: PublishableDraftContract = {
  operation_id: "content-editor-writing-security",
  kind: "content_draft",
  surface: "public_site",
  route: "/writing/security-with-less-friction",
  status: "draft",
  authority_state: "passkey_owner_draft_saved_no_public_change",
  allowed_actions: '["save_draft","render_preview","publish_with_proof"]',
  forbidden_actions:
    '["send","schedule_newsletter","deploy","write_source_file","sync_provider"]',
  page_key: payload.page_key,
  slug: payload.slug,
  title: payload.title,
  visibility: payload.visibility,
  published_from_operation_id: null,
};

describe("publishableDraftError", () => {
  it("accepts the exact owner editor draft contract", () => {
    expect(publishableDraftError(draft, payload)).toBeNull();
  });

  it("rejects a replayed publish operation", () => {
    expect(
      publishableDraftError(
        {
          ...draft,
          status: "published",
          published_from_operation_id: draft.operation_id,
        },
        payload,
      ),
    ).toBe("draft_already_published");
  });

  it("rejects a draft whose capability forbids public writes", () => {
    expect(
      publishableDraftError(
        {
          ...draft,
          allowed_actions: '["save_draft","render_preview"]',
          forbidden_actions: '["publish","write_page_content"]',
        },
        payload,
      ),
    ).toBe("draft_not_publishable");
  });

  it("rejects denormalized metadata that does not match the payload", () => {
    expect(
      publishableDraftError({ ...draft, slug: "altered-after-save" }, payload),
    ).toBe("draft_contract_mismatch");
  });
});
