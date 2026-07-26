import { useEffect, useMemo, useState } from "react";

type Props = {
  value: string;
  format?: "auto" | "relative";
  isLive?: boolean;
};

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
  style: "long",
});

const absoluteFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const titleFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function relativeValue(value: Date, now: number) {
  const difference = value.getTime() - now;
  const absoluteDifference = Math.abs(difference);

  if (absoluteDifference < 60_000) return "now";
  if (absoluteDifference < 3_600_000) {
    return relativeFormatter.format(Math.round(difference / 60_000), "minute");
  }
  if (absoluteDifference < 86_400_000) {
    return relativeFormatter.format(Math.round(difference / 3_600_000), "hour");
  }
  return relativeFormatter.format(Math.round(difference / 86_400_000), "day");
}

export function AdminTimestamp({
  value,
  format = "auto",
  isLive = false,
}: Props) {
  const parsed = useMemo(() => new Date(value), [value]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isLive || Number.isNaN(parsed.getTime())) return;
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, [isLive, parsed]);

  if (Number.isNaN(parsed.getTime())) return <span>time unknown</span>;

  const relative = relativeValue(parsed, now);
  const text =
    format === "relative" || Math.abs(parsed.getTime() - now) < 604_800_000
      ? relative
      : absoluteFormatter.format(parsed);

  return (
    <time dateTime={parsed.toISOString()} title={titleFormatter.format(parsed)}>
      {text}
    </time>
  );
}
