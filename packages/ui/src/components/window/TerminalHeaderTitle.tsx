"use client";

import { useState, useEffect, useMemo } from "react";

export interface TerminalHeaderTitleProps {
  defaultTitle?: string;
}

export function TerminalHeaderTitle({ defaultTitle = "ani@potts:~/anipotts.com" }: TerminalHeaderTitleProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(defaultTitle.substring(0, index + 1));
      index++;
      if (index === defaultTitle.length) {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [defaultTitle]);

  // Split at "~/" so the prefix (ani@potts:) can be hidden on mobile
  const splitIndex = useMemo(() => {
    const idx = defaultTitle.indexOf("~/");
    return idx > 0 ? idx : 0;
  }, [defaultTitle]);

  const displayedPrefix = displayedText.substring(0, Math.min(displayedText.length, splitIndex));
  const displayedPath = displayedText.substring(splitIndex);

  return (
    <span className="ml-3 text-[10px] md:text-xs text-gray-500 font-medium tracking-wide">
      {splitIndex > 0 && <span className="hidden md:inline">{displayedPrefix}</span>}
      {displayedPath}
      <span className="animate-pulse">_</span>
    </span>
  );
}
