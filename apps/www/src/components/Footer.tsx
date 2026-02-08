"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [marketStatus, setMarketStatus] = useState<"open" | "closed">("closed");
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const nyTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
      );

      const day = nyTime.getDay();
      const hour = nyTime.getHours();
      const minute = nyTime.getMinutes();

      const isWeekday = day >= 1 && day <= 5;
      const isAfterOpen = hour > 9 || (hour === 9 && minute >= 30);
      const isBeforeClose = hour < 16;

      setMarketStatus(
        isWeekday && isAfterOpen && isBeforeClose ? "open" : "closed"
      );
      setTime(
        now
          .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "America/New_York",
          })
          .toLowerCase()
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full mt-auto py-6">
      <div className="flex flex-row flex-wrap justify-between gap-x-8 gap-y-2 text-xs uppercase tracking-wider font-mono">
        <div className="flex items-center gap-2">
          <span className="text-faint">base:</span>
          <span className="text-secondary">new york city</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-faint">focus:</span>
          <span className="text-secondary">durable execution</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-faint">market:</span>
          <span
            className={
              marketStatus === "open" ? "text-[#4ade80]" : "text-[#ef4444]"
            }
          >
            {marketStatus}
          </span>
          {time && <span className="text-secondary">{time}</span>}
        </div>
      </div>
    </footer>
  );
}
