import { useMemo, useState } from "react";
import { Calendar, type ISODateString } from "@astryxdesign/core/Calendar";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { Item } from "@astryxdesign/core/Item";
import { CalendarBlankIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import type { AdminFocusRecord } from "./AdminFocusRail";

type LifeAttention = {
  id: string;
  title: string;
  currentFact: string;
  nextAction: string;
  owner: string;
  status: string;
  updatedAt?: string;
  source: string;
  href: string;
  proof: string;
};

type Props = {
  attention: LifeAttention[];
  sourceAvailable: boolean;
};

const localNow = new Date();
const today =
  `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, "0")}-${String(localNow.getDate()).padStart(2, "0")}` as ISODateString;

export function LifeCalendar({ attention, sourceAvailable }: Props) {
  const [selectedDate, setSelectedDate] = useState<ISODateString>(today);
  const [view, setView] = useState("agenda");
  const selectedLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date(`${selectedDate}T12:00:00`)),
    [selectedDate],
  );

  return (
    <div className="life-calendar-layout">
      <section className="life-calendar-navigator" aria-label="choose a date">
        <Calendar
          mode="single"
          value={selectedDate}
          onChange={setSelectedDate}
          weekStartsOn="sun"
          hasOutsideDays
        />
      </section>

      <section className="life-calendar-agenda" aria-labelledby="agenda-title">
        <header>
          <div>
            <h2 id="agenda-title">{selectedLabel}</h2>
            <span>
              {sourceAvailable
                ? "verified schedule"
                : "calendar source unavailable"}
            </span>
          </div>
          <SegmentedControl
            value={view}
            onChange={setView}
            label="calendar view"
            size="sm"
          >
            <SegmentedControlItem value="day" label="day" />
            <SegmentedControlItem value="week" label="week" />
            <SegmentedControlItem value="agenda" label="agenda" />
          </SegmentedControl>
        </header>

        <EmptyState
          isCompact
          headingLevel={3}
          icon={<CalendarBlankIcon size={24} weight="regular" />}
          title={
            sourceAvailable
              ? "No verified events for this date"
              : "Calendar is not connected"
          }
          description={
            sourceAvailable
              ? "Only source-backed events appear here."
              : "The date navigator is available. Events stay empty until a trusted read source is connected."
          }
        />
      </section>

      <section
        className="life-calendar-attention"
        aria-labelledby="dated-title"
      >
        <header>
          <h2 id="dated-title">linked attention</h2>
          <a href="/?category=life">Inbox</a>
        </header>
        {attention.length ? (
          <div>
            {attention.map((item) => {
              const record: AdminFocusRecord = {
                id: item.id,
                kind: "life",
                title: item.title,
                currentFact: item.currentFact,
                nextAction: item.nextAction,
                owner: item.owner,
                status: item.status,
                updatedAt: item.updatedAt,
                source: item.source,
                href: item.href,
                proof: item.proof,
              };
              return (
                <Item
                  key={item.id}
                  density="compact"
                  align="start"
                  label={item.title}
                  description={item.nextAction}
                  labelLines={1}
                  descriptionLines={2}
                  endContent={
                    <button
                      type="button"
                      className="quiet-icon-action"
                      data-admin-focus-record={JSON.stringify(record)}
                      aria-label={`open details for ${item.title}`}
                      title="details"
                    >
                      <SidebarSimpleIcon
                        size={18}
                        weight="regular"
                        aria-hidden="true"
                      />
                    </button>
                  }
                />
              );
            })}
          </div>
        ) : (
          <p className="quiet-empty-state">
            No Life attention is linked to the calendar.
          </p>
        )}
      </section>
    </div>
  );
}
