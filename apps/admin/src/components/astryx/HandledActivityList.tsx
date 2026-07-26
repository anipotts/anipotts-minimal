import { Item } from "@astryxdesign/core/Item";
import { IconButton } from "@astryxdesign/core/IconButton";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { SourceMark } from "../SourceMark";
import type { AdminFocusRecord } from "./AdminFocusRail";
import { AdminTimestamp } from "./AdminTimestamp";

type HandledTask = {
  id: string;
  provider: "codex" | "claude";
  title: string;
  goal: string;
  nextAction: string;
  state: string;
  updatedAt: string;
  owner: string;
  href: string;
  source: string;
  proof: string;
};

type Props = {
  tasks: HandledTask[];
};

export function HandledActivityList({ tasks }: Props) {
  return (
    <div className="operator-handled-list">
      {tasks.map((task) => {
        const focusRecord: AdminFocusRecord = {
          id: task.id,
          kind: "active work",
          title: task.title,
          currentFact: task.goal,
          nextAction: task.nextAction,
          owner: task.owner,
          status: task.state,
          updatedAt: task.updatedAt,
          source: task.provider,
          href: task.href,
          proof: task.proof,
        };
        return (
          <Item
            key={task.id}
            density="balanced"
            align="start"
            startContent={
              <span className="operator-handled-source">
                <SourceMark provider={task.provider} compact />
                <StatusDot
                  variant={task.state === "working" ? "success" : "warning"}
                  label={task.state}
                  isPulsing={task.state === "working"}
                  tooltip={task.state}
                />
              </span>
            }
            label={task.title}
            description={task.goal}
            labelLines={1}
            descriptionLines={1}
            endContent={
              <span className="operator-handled-end">
                <AdminTimestamp
                  value={task.updatedAt}
                  format="relative"
                  isLive
                />
                <IconButton
                  label={`view ${task.title} details`}
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
              </span>
            }
          />
        );
      })}
    </div>
  );
}
