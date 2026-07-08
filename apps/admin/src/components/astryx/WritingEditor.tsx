import { useMemo, useState } from "react";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import type {
  ContentEditorPayload,
  ContentEditorState,
} from "../../lib/content-editor";

type EditorResponse = {
  ok?: boolean;
  operation_id?: string;
  preview_href?: string;
  publishable?: boolean;
  public_route?: string;
  next_version?: number;
  rollback_ref?: string;
  visibility?: string;
  title?: string;
  slug?: string;
  version?: number;
  publish_event_id?: string;
  error?: string;
};

type WritingEditorProps = {
  currentPublicRoute: string;
  currentRollbackReference: string;
  editorState: ContentEditorState;
  isNew: boolean;
  pageMode: string;
  pageSummary: string;
  sourceFieldCount: number;
};

type DraftState = {
  operationId: string;
  previewHref: string;
  publishable: boolean;
  publicRoute: string;
  rollbackRef: string;
  title: string;
  visibility: string;
  version: number;
};

type EditorFormState = ReturnType<typeof initialPayload>;

const visibilityOptions = ["private", "draft", "hidden", "published"];

export function WritingEditor({
  currentPublicRoute,
  currentRollbackReference,
  editorState,
  isNew,
  pageMode,
  pageSummary,
  sourceFieldCount,
}: WritingEditorProps) {
  const initial = useMemo(
    () => initialPayload(editorState.current, isNew),
    [editorState.current, isNew],
  );
  const [form, setForm] = useState<EditorFormState>(initial);
  const [draft, setDraft] = useState<DraftState | null>(() => {
    const latest = editorState.latest_draft;
    if (!latest) return null;
    return {
      operationId: latest.id,
      previewHref: latest.view_href,
      publishable: latest.status === "published",
      publicRoute: currentPublicRoute,
      rollbackRef: latest.rollback_target,
      title: initial.title || "selected draft",
      visibility: latest.status,
      version: editorState.current_version + 1,
    };
  });
  const [status, setStatus] = useState(
    editorState.latest_draft
      ? `latest draft ${editorState.latest_draft.id}`
      : "new content starts as a private draft",
  );
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  async function saveDraft() {
    setStatus("saving draft to D1");
    const data = await postEditor({
      action: "save_draft",
      kind: form.kind,
      page_key: form.page_key,
      title: form.title,
      slug: form.slug,
      date: form.date,
      visibility: form.visibility,
      summary: form.summary,
      tags: form.tags,
      body: form.body,
    });

    if (!data.ok || !data.operation_id) {
      throw new Error(data.error ?? "draft save failed");
    }

    setDraft({
      operationId: data.operation_id,
      previewHref: data.preview_href ?? "#",
      publishable: data.publishable === true,
      publicRoute: data.public_route ?? currentPublicRoute,
      rollbackRef: data.rollback_ref ?? currentRollbackReference,
      title: data.title ?? form.title,
      visibility: data.visibility ?? form.visibility,
      version: data.next_version ?? editorState.current_version + 1,
    });
    setStatus(`saved ${data.operation_id}`);
  }

  async function publishDraft() {
    if (!draft?.operationId) return;
    setStatus("publishing selected draft");
    const data = await postEditor({
      action: "publish",
      operation_id: draft.operationId,
    });
    if (!data.ok) throw new Error(data.error ?? "publish failed");
    setStatus(
      `published v${data.version} to ${data.public_route ?? draft.publicRoute}`,
    );
    setPublishDialogOpen(false);
    setDraft({
      ...draft,
      publishable: false,
      version: data.version ?? draft.version,
    });
  }

  return (
    <section className="astryx-editor" aria-label="owner writing editor">
      <div className="astryx-editor-main">
        <section className="astryx-editor-panel">
          <div className="section-head">
            <div>
              <p>{isNew ? "writing surface" : `${form.kind} content`}</p>
              <h2>{isNew ? "write new draft" : form.title}</h2>
            </div>
            <Badge
              label={isNew ? "private default" : form.visibility}
              variant={form.visibility === "published" ? "success" : "neutral"}
            />
          </div>

          <div className="astryx-editor-grid">
            <TextInput
              label="title"
              value={form.title}
              isRequired
              width="100%"
              onChange={(title) => setForm((value) => ({ ...value, title }))}
            />
            <TextInput
              label="slug"
              value={form.slug}
              isRequired
              width="100%"
              onChange={(slug) => setForm((value) => ({ ...value, slug }))}
            />
            <TextInput
              label="date"
              value={form.date}
              width="100%"
              onChange={(date) => setForm((value) => ({ ...value, date }))}
            />
            <label className="astryx-native-field">
              <span>visibility</span>
              <select
                value={form.visibility}
                onChange={(event) => {
                  const visibility = event.currentTarget
                    .value as EditorFormState["visibility"];
                  setForm((value) => ({
                    ...value,
                    visibility,
                  }));
                }}
              >
                {visibilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div className="astryx-wide">
              <TextArea
                label="summary"
                value={form.summary}
                rows={3}
                maxLength={600}
                isRequired
                width="100%"
                onChange={(summary) =>
                  setForm((value) => ({ ...value, summary }))
                }
              />
            </div>
            <div className="astryx-wide">
              <TextInput
                label="tags"
                value={form.tags}
                width="100%"
                placeholder="agents, codex, admin"
                onChange={(tags) => setForm((value) => ({ ...value, tags }))}
              />
            </div>
            <div className="astryx-wide">
              <TextArea
                label="body markdown"
                value={form.body}
                rows={20}
                isRequired
                width="100%"
                onChange={(body) => setForm((value) => ({ ...value, body }))}
              />
            </div>
          </div>

          <div className="astryx-editor-actions">
            <Button
              label="save draft"
              variant="primary"
              clickAction={saveDraft}
            />
            <Button
              label="preview"
              variant="secondary"
              href={draft?.previewHref ?? "#"}
              isDisabled={!draft}
            />
            <Button
              label="publish selected draft"
              variant="destructive"
              isDisabled={!draft?.publishable}
              onClick={() => setPublishDialogOpen(true)}
            />
            <span>{status}</span>
          </div>
        </section>

        <aside className="astryx-editor-side">
          <section className="table-card">
            <div className="section-head">
              <div>
                <p>current public record</p>
                <h2>{pageSummary || "none yet"}</h2>
              </div>
              <Badge
                label={editorState.current_version > 0 ? "versioned" : "new"}
                variant="neutral"
              />
            </div>
            <dl className="astryx-proof-list">
              <div>
                <dt>source</dt>
                <dd>{pageMode}</dd>
              </div>
              <div>
                <dt>fields</dt>
                <dd>{sourceFieldCount}</dd>
              </div>
              <div>
                <dt>version</dt>
                <dd>v{editorState.current_version}</dd>
              </div>
              <div>
                <dt>storage</dt>
                <dd>content_draft_operations</dd>
              </div>
              <div>
                <dt>publish proof</dt>
                <dd>content_publish_events</dd>
              </div>
            </dl>
          </section>

          <section className="table-card">
            <div className="section-head">
              <div>
                <p>revision history</p>
                <h2>{editorState.revisions.length} entries</h2>
              </div>
              <Badge label="view only" variant="neutral" />
            </div>
            <div className="record-list compact-list">
              {editorState.revisions.length === 0 ? (
                <article className="record-row">
                  <div>
                    <p>empty</p>
                    <h3>No saved revisions for this page key yet.</h3>
                  </div>
                </article>
              ) : (
                editorState.revisions.map((revision) => (
                  <article
                    className="record-row revision-row"
                    key={revision.id}
                  >
                    <div>
                      <p>
                        {revision.source} / {revision.status}
                      </p>
                      <h3>{revision.summary}</h3>
                    </div>
                    <dl>
                      <div>
                        <dt>time</dt>
                        <dd>{revision.timestamp}</dd>
                      </div>
                      <div>
                        <dt>author</dt>
                        <dd>{revision.author}</dd>
                      </div>
                      <div>
                        <dt>action</dt>
                        <dd>
                          <a href={revision.view_href}>view version</a>
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      {publishDialogOpen && draft ? (
        <div className="astryx-dialog-backdrop" role="presentation">
          <section
            className="astryx-publish-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-dialog-title"
          >
            <div>
              <p>publish selected draft</p>
              <h2 id="publish-dialog-title">{draft.title}</h2>
            </div>
            <dl className="astryx-proof-list">
              <div>
                <dt>route</dt>
                <dd>{draft.publicRoute}</dd>
              </div>
              <div>
                <dt>version</dt>
                <dd>v{draft.version}</dd>
              </div>
              <div>
                <dt>visibility</dt>
                <dd>{draft.visibility}</dd>
              </div>
              <div>
                <dt>rollback reference</dt>
                <dd>{draft.rollbackRef}</dd>
              </div>
            </dl>
            <p>
              publish writes public page_content and content_publish_events
              only. it does not send newsletters, deploy, or write source files.
            </p>
            <div className="publish-dialog-actions">
              <Button
                label="cancel"
                variant="ghost"
                onClick={() => setPublishDialogOpen(false)}
              />
              <Button
                label="confirm publish"
                variant="destructive"
                clickAction={publishDraft}
              />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function initialPayload(payload: ContentEditorPayload, isNew: boolean) {
  return {
    kind: payload.kind,
    page_key: payload.page_key,
    title: isNew ? "" : payload.title,
    slug: isNew ? "" : payload.slug,
    summary: isNew ? "" : payload.summary,
    tags: isNew ? "" : payload.tags.join(", "),
    body: isNew ? "" : payload.body,
    visibility: isNew ? "private" : payload.visibility,
    date: payload.date,
  };
}

async function postEditor(
  body: Record<string, unknown>,
): Promise<EditorResponse> {
  const response = await fetch("/api/admin/content/editor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as EditorResponse;
  if (!response.ok) {
    throw new Error(data.error ?? "content editor request failed");
  }
  return data;
}
