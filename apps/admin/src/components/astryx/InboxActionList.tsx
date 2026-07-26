import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Item } from "@astryxdesign/core/Item";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { iconForNav } from "../admin-icons";
import type { AdminInboxItem } from "../../data/inbox";
import type { AdminFocusRecord } from "./AdminFocusRail";
import { AdminTimestamp } from "./AdminTimestamp";

export type InboxActionRow = {
  item: AdminInboxItem;
  index: number;
  domainHref: string;
  linkedState?: string;
  linkedHost?: string;
};

type Props = {
  rows: InboxActionRow[];
  secondary?: boolean;
};

export function InboxActionList({ rows, secondary = false }: Props) {
  return (
    <ol
      className={`operator-attention-list operator-item-list${secondary ? " is-secondary" : ""}`}
    >
      {rows.map(({ item, index, domainHref, linkedState, linkedHost }) => {
        const Icon =
          iconForNav[item.category === "fleet" ? "fleet" : item.category];
        const hasObservedTime = !item.updated_at.startsWith("1970-01-01");
        const focusRecord: AdminFocusRecord = {
          id: item.id,
          kind: item.category,
          title: item.title,
          currentFact: item.summary,
          nextAction: item.next_action,
          owner: item.owner,
          status: linkedState ?? item.status,
          updatedAt: hasObservedTime ? item.updated_at : undefined,
          source: item.source,
          href: item.href,
          proof: item.proof,
        };

        return (
          <Item
            key={item.id}
            as="li"
            className={`operator-item-row risk-${item.risk}`}
            density="balanced"
            align="start"
            marker={
              <span className="operator-item-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
            }
            startContent={
              <span className="operator-item-domain" title={item.category}>
                <Icon size={18} weight="regular" aria-hidden="true" />
              </span>
            }
            label={
              <span className="operator-item-label">
                <small>{item.category}</small>
                <a href={domainHref}>{item.title}</a>
              </span>
            }
            description={
              <span className="operator-item-description">
                <strong>{item.next_action}</strong>
                <small>{item.summary}</small>
              </span>
            }
            endContent={
              <span className="operator-item-end">
                <span className="operator-item-status">
                  <StatusDot
                    variant={
                      item.risk === "high"
                        ? "error"
                        : linkedState === "working"
                          ? "success"
                          : "neutral"
                    }
                    label={linkedState ?? item.status}
                    tooltip={linkedState ?? item.status}
                    isPulsing={linkedState === "working"}
                  />
                  <span>
                    <strong>{item.owner}</strong>
                    <small>
                      {linkedState && linkedHost
                        ? `${linkedState} · ${linkedHost}`
                        : item.timeframe}
                    </small>
                    {hasObservedTime ? (
                      <AdminTimestamp
                        value={item.updated_at}
                        format="relative"
                        isLive
                      />
                    ) : (
                      <small>time unknown</small>
                    )}
                  </span>
                </span>
                <span className="operator-item-actions">
                  <IconButton
                    label={`view ${item.title} details`}
                    tooltip="details"
                    variant="ghost"
                    size="lg"
                    icon={
                      <SidebarSimpleIcon
                        size={18}
                        weight="regular"
                        aria-hidden="true"
                      />
                    }
                    data-admin-focus-record={JSON.stringify(focusRecord)}
                  />
                  <Button
                    label="review"
                    href={item.href}
                    variant={item.risk === "high" ? "primary" : "secondary"}
                    size="sm"
                  />
                </span>
              </span>
            }
            data-attention-id={item.id}
            data-entity-id={item.entity_id}
            data-attention-status={item.status}
            data-attention-updated={item.updated_at}
          />
        );
      })}
    </ol>
  );
}
