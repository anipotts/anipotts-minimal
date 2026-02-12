"use client";

import { useRef, useEffect, useState } from "react";
import { PROMPT_USER, getPromptPath, CURSOR_BLINK_MS } from "./constants";

interface TerminalInputProps {
  subdomain: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onTab: () => void;
  ghostText?: string;
}

export function TerminalInput({
  subdomain,
  value,
  onChange,
  onSubmit,
  onArrowUp,
  onArrowDown,
  onTab,
  ghostText,
}: TerminalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setCursorVisible(true);
      return;
    }
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, CURSOR_BLINK_MS);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Reset cursor blink on input change
  useEffect(() => {
    setCursorVisible(true);
  }, [value]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onArrowUp();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onArrowDown();
    } else if (e.key === "Tab") {
      e.preventDefault();
      onTab();
    }
  };

  const promptPath = getPromptPath(subdomain);

  // Ghost text for autocomplete preview
  const ghost = ghostText && ghostText.startsWith(value) && ghostText !== value
    ? ghostText.slice(value.length)
    : "";

  return (
    <div
      className="flex items-center px-3 py-2 font-mono text-xs border-t border-[var(--border-subtle)] bg-[var(--card-darker)] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-green-400 shrink-0">{PROMPT_USER}</span>
      <span className="text-[var(--text-muted)] shrink-0">:</span>
      <span className="text-[var(--accent-400)] shrink-0">{promptPath}</span>
      <span className="text-[var(--text-secondary)] shrink-0 mx-1">$</span>

      <div className="relative flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-[var(--text-secondary)] outline-none caret-transparent"
          autoComplete="off"
          spellCheck={false}
          aria-label="Terminal input"
        />
        {/* Overlay with cursor and ghost text */}
        <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
          <span className="text-[var(--text-secondary)] whitespace-pre">{value}</span>
          <span
            className={`inline-block w-[7px] h-[14px] bg-green-400 ${
              cursorVisible ? "opacity-100" : "opacity-0"
            }`}
          />
          {ghost && (
            <span className="text-[var(--text-faint)] whitespace-pre">{ghost}</span>
          )}
        </div>
      </div>
    </div>
  );
}
