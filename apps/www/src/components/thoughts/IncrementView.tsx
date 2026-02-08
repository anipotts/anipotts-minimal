"use client";

import { useEffect, useRef } from "react";
import { incrementThoughtViews } from "@/app/(subdomain)/thoughts/actions";

/**
 * Component that increments view count on mount.
 * Uses useRef to prevent double-counting in React Strict Mode.
 */
export default function IncrementView({ slug }: { slug: string }) {
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (!hasIncremented.current) {
      incrementThoughtViews(slug);
      hasIncremented.current = true;
    }
  }, [slug]);

  return null;
}
