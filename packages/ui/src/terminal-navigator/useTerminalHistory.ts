"use client";

import { useState, useCallback, useRef } from "react";
import { MAX_HISTORY } from "./constants";

const STORAGE_KEY = "terminal-history";

function loadHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // sessionStorage unavailable
  }
}

export function useTerminalHistory() {
  const [history, setHistory] = useState<string[]>(loadHistory);
  const indexRef = useRef(-1);

  const push = useCallback((cmd: string) => {
    setHistory((prev) => {
      const next = [cmd, ...prev.filter((c) => c !== cmd)].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
    indexRef.current = -1;
  }, []);

  const navigateUp = useCallback(
    (currentInput: string): string => {
      const nextIndex = indexRef.current + 1;
      if (nextIndex >= history.length) return currentInput;
      indexRef.current = nextIndex;
      return history[nextIndex];
    },
    [history]
  );

  const navigateDown = useCallback(
    (): string => {
      if (indexRef.current <= 0) {
        indexRef.current = -1;
        return "";
      }
      indexRef.current -= 1;
      return history[indexRef.current];
    },
    [history]
  );

  const resetIndex = useCallback(() => {
    indexRef.current = -1;
  }, []);

  return { history, push, navigateUp, navigateDown, resetIndex };
}
