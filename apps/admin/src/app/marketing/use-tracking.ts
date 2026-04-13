"use client";

import { useState, useEffect, useCallback } from "react";

export interface TrackingData {
  responded: string[];
  saved: string[];
  skipped: string[];
}

function loadTracking(key: string): TrackingData {
  if (typeof window === "undefined")
    return { responded: [], saved: [], skipped: [] };
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as TrackingData;
  } catch {
    /* ignore */
  }
  return { responded: [], saved: [], skipped: [] };
}

function saveTracking(key: string, data: TrackingData) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function useTracking(storageKey: string) {
  const [tracking, setTracking] = useState<TrackingData>({
    responded: [],
    saved: [],
    skipped: [],
  });

  useEffect(() => {
    setTracking(loadTracking(storageKey));
  }, [storageKey]);

  const track = useCallback(
    (id: string, category: keyof TrackingData) => {
      setTracking((prev) => {
        const next = {
          ...prev,
          [category]: prev[category].includes(id)
            ? prev[category]
            : [...prev[category], id],
        };
        saveTracking(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  return { tracking, track };
}
