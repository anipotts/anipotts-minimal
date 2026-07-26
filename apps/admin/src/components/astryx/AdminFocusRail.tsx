import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Item } from "@astryxdesign/core/Item";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import {
  ArrowSquareOutIcon,
  CalendarBlankIcon,
  XIcon,
} from "@phosphor-icons/react";
import { SourceMark } from "../SourceMark";
import { AdminTimestamp } from "./AdminTimestamp";

export type AdminFocusRecord = {
  id: string;
  kind: string;
  title: string;
  currentFact: string;
  nextAction?: string;
  owner?: string;
  status?: string;
  updatedAt?: string;
  source?: string;
  href?: string;
  proof?: string;
};

export type ActiveFocusWork = {
  id: string;
  provider: "codex" | "claude";
  title: string;
  goal: string;
  state: string;
  updatedAt: string;
};

type Props = {
  activeWork: ActiveFocusWork[];
  hasCurrentWork: boolean;
};

type InboxResponse = {
  items?: Array<{
    id: string;
    title: string;
    next_action: string;
    status: string;
    owner: string;
    updated_at: string;
    href: string;
    proof: string;
    source: string;
  }>;
};

export function AdminFocusRail({ activeWork, hasCurrentWork }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [record, setRecord] = useState<AdminFocusRecord | null>(null);
  const [attention, setAttention] = useState<AdminFocusRecord[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const currentTime = useMemo(() => new Date().toISOString(), [isOpen]);

  useEffect(() => {
    const openRecord = (
      next: AdminFocusRecord | null,
      opener?: HTMLElement,
    ) => {
      previousFocus.current =
        opener ?? (document.activeElement as HTMLElement | null);
      setRecord(next);
      setIsOpen(true);
      requestAnimationFrame(() => railRef.current?.focus());
    };

    const onFocusEvent = (event: Event) => {
      const customEvent = event as CustomEvent<
        AdminFocusRecord | { mode: "overview" } | undefined
      >;
      if (customEvent.detail && "mode" in customEvent.detail) {
        openRecord(null);
        return;
      }
      openRecord(customEvent.detail ?? null);
    };

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-admin-focus-record]");
      if (!trigger) return;
      const raw = trigger.dataset.adminFocusRecord;
      if (!raw) return;
      try {
        event.preventDefault();
        openRecord(JSON.parse(raw) as AdminFocusRecord, trigger);
      } catch {
        // Invalid records fail closed without opening a misleading panel.
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        setIsOpen(false);
        requestAnimationFrame(() => previousFocus.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = railRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (document.activeElement === railRef.current) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("admin:focus", onFocusEvent);
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("admin:focus", onFocusEvent);
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || record || attention) return;
    let isCurrent = true;
    setLoadFailed(false);
    fetch("/api/admin/inbox", {
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("focus_read_failed");
        return (await response.json()) as InboxResponse;
      })
      .then((payload) => {
        if (!isCurrent) return;
        setAttention(
          (payload.items ?? []).slice(0, 4).map((item) => ({
            id: item.id,
            kind: "attention",
            title: item.title,
            currentFact: item.next_action,
            nextAction: item.next_action,
            owner: item.owner,
            status: item.status,
            updatedAt: item.updated_at.startsWith("1970-01-01")
              ? undefined
              : item.updated_at,
            source: item.source,
            href: item.href,
            proof: item.proof,
          })),
        );
      })
      .catch(() => {
        if (isCurrent) setLoadFailed(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [attention, isOpen, record]);

  const close = () => {
    setIsOpen(false);
    requestAnimationFrame(() => previousFocus.current?.focus());
  };

  return (
    <>
      <button
        className="admin-focus-backdrop"
        type="button"
        aria-label="close focus"
        onClick={close}
        data-open={isOpen ? "true" : "false"}
        tabIndex={isOpen ? 0 : -1}
      />
      <aside
        ref={railRef}
        className="admin-focus-rail"
        data-open={isOpen ? "true" : "false"}
        aria-hidden={!isOpen}
        aria-labelledby={isOpen ? "admin-focus-title" : undefined}
        aria-modal={isOpen ? "true" : undefined}
        role="dialog"
        tabIndex={-1}
      >
        {isOpen ? (
          <>
            <header className="admin-focus-header">
              <div>
                <span>{record?.kind ?? "now"}</span>
                <h2 id="admin-focus-title">{record?.title ?? "Focus"}</h2>
              </div>
              <IconButton
                ref={closeRef}
                label="close focus"
                tooltip="close"
                variant="ghost"
                size="lg"
                icon={<XIcon size={18} weight="regular" aria-hidden="true" />}
                onClick={close}
              />
            </header>

            {record ? (
              <FocusRecordView record={record} />
            ) : (
              <FocusOverview
                activeWork={activeWork}
                attention={attention}
                currentTime={currentTime}
                hasCurrentWork={hasCurrentWork}
                loadFailed={loadFailed}
              />
            )}
          </>
        ) : null}
      </aside>
    </>
  );
}

function FocusRecordView({ record }: { record: AdminFocusRecord }) {
  const provider =
    record.source === "codex" ||
    record.source === "claude" ||
    record.source === "chatgpt"
      ? record.source
      : null;

  return (
    <div className="admin-focus-body">
      <section className="admin-focus-primary">
        <span>current</span>
        <p>{record.currentFact}</p>
      </section>
      {record.nextAction ? (
        <section className="admin-focus-primary">
          <span>next</span>
          <p>{record.nextAction}</p>
        </section>
      ) : null}

      <dl className="admin-focus-metadata">
        {record.status ? (
          <div>
            <dt>state</dt>
            <dd>{record.status}</dd>
          </div>
        ) : null}
        {record.owner ? (
          <div>
            <dt>owner</dt>
            <dd>{record.owner}</dd>
          </div>
        ) : null}
        {record.updatedAt ? (
          <div>
            <dt>updated</dt>
            <dd>
              <AdminTimestamp value={record.updatedAt} format="auto" isLive />
            </dd>
          </div>
        ) : null}
        {record.source ? (
          <div>
            <dt>source</dt>
            <dd>
              {provider ? <SourceMark provider={provider} /> : record.source}
            </dd>
          </div>
        ) : null}
        {record.proof ? (
          <div className="is-wide">
            <dt>proof</dt>
            <dd>{record.proof}</dd>
          </div>
        ) : null}
      </dl>

      {record.href ? (
        <Button
          label="open full view"
          href={record.href}
          variant="secondary"
          endContent={
            <ArrowSquareOutIcon size={16} weight="regular" aria-hidden="true" />
          }
        />
      ) : null}
    </div>
  );
}

function FocusOverview({
  activeWork,
  attention,
  currentTime,
  hasCurrentWork,
  loadFailed,
}: {
  activeWork: ActiveFocusWork[];
  attention: AdminFocusRecord[] | null;
  currentTime: string;
  hasCurrentWork: boolean;
  loadFailed: boolean;
}) {
  return (
    <div className="admin-focus-body">
      <section className="admin-focus-time">
        <CalendarBlankIcon size={18} weight="regular" aria-hidden="true" />
        <div>
          <strong>
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(new Date(currentTime))}
          </strong>
          <span>
            {new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(currentTime))}
          </span>
        </div>
        <a href="/life/calendar">calendar</a>
      </section>

      <section className="admin-focus-list">
        <header>
          <h3>needs you</h3>
          <a href="/inbox">Inbox</a>
        </header>
        {loadFailed ? (
          <p className="admin-focus-inline-state">
            Attention is unavailable right now.
          </p>
        ) : attention ? (
          attention.map((item) => (
            <Item
              key={item.id}
              density="compact"
              align="start"
              label={item.title}
              description={item.currentFact}
              labelLines={1}
              descriptionLines={2}
              href={`/?item=${encodeURIComponent(item.id)}`}
              endContent={
                item.updatedAt ? (
                  <AdminTimestamp value={item.updatedAt} format="relative" />
                ) : null
              }
            />
          ))
        ) : (
          <div className="admin-focus-loading" aria-label="loading attention">
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        )}
      </section>

      <section className="admin-focus-list">
        <header>
          <h3>active agents</h3>
          <a href="/work?view=now">Work</a>
        </header>
        {hasCurrentWork ? (
          activeWork.map((task) => (
            <Item
              key={task.id}
              density="compact"
              align="start"
              startContent={<SourceMark provider={task.provider} compact />}
              label={task.title}
              description={task.goal}
              labelLines={1}
              descriptionLines={2}
              href={`/work?view=now#task-${encodeURIComponent(task.id)}`}
              endContent={
                <span className="admin-focus-state">
                  <StatusDot
                    variant={task.state === "working" ? "success" : "warning"}
                    label={task.state}
                    isPulsing={task.state === "working"}
                    tooltip={task.state}
                  />
                  <AdminTimestamp
                    value={task.updatedAt}
                    format="relative"
                    isLive
                  />
                </span>
              }
            />
          ))
        ) : (
          <p className="admin-focus-inline-state">
            Live agent activity is unavailable.
          </p>
        )}
      </section>
    </div>
  );
}
