"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MiniStreamState } from "./types";

const MINI_API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_MINI_API_URL || "https://api.mini.anipotts.com"
    : "";
const MINI_API_KEY =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_MINI_API_KEY || ""
    : "";

const INITIAL_STATE: MiniStreamState = {
  vitals: null,
  processes: null,
  agents: null,
  repos: null,
  rudy: null,
  sessions: null,
  syncthing: null,
  presence: null,
  vault: null,
  connected: false,
  lastEvent: null,
};

type SSEEventType = keyof Omit<MiniStreamState, "connected" | "lastEvent">;

export function useMiniStream(): MiniStreamState {
  const [state, setState] = useState<MiniStreamState>(INITIAL_STATE);
  const esRef = useRef<EventSource | null>(null);

  const handleEvent = useCallback((eventType: SSEEventType, data: string) => {
    try {
      const parsed = JSON.parse(data);
      setState((prev: MiniStreamState) => ({
        ...prev,
        [eventType]: parsed,
        lastEvent: new Date().toISOString(),
      }));
    } catch {
      // Skip malformed events
    }
  }, []);

  useEffect(() => {
    if (!MINI_API_KEY) {
      setState((prev: MiniStreamState) => ({ ...prev, connected: false }));
      return;
    }

    // EventSource doesn't support custom headers natively.
    // Pass token as query param (Mini API should accept both).
    const url = `${MINI_API_URL}/stream?token=${encodeURIComponent(MINI_API_KEY)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setState((p) => ({ ...p, connected: true }));
    };

    es.onerror = () => {
      setState((p) => ({ ...p, connected: false }));
    };

    const eventTypes: SSEEventType[] = [
      "vitals",
      "processes",
      "agents",
      "repos",
      "rudy",
      "sessions",
      "syncthing",
      "presence",
      "vault",
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e: MessageEvent) => {
        handleEvent(type, e.data);
      });
    }

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [handleEvent]);

  return state;
}
