"use client";

import { useEffect, useRef } from "react";

const PORTAL_RADIUS = 80;
const LERP = 0.15;
const FRAME_INTERVAL = 1000 / 30;

/**
 * CursorPortal: a see-through circle that reveals the wave background
 * behind the terminal window. The circle follows the cursor with a
 * clean hard edge and accent border.
 *
 * No content displacement. No opacity fade. Desktop only.
 * The circle is a transparent hole in the card background layers,
 * letting the animated waves show through.
 */
export function CursorPortal() {
  const holeRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -999, y: -999, sx: -999, sy: -999 });
  const activeRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const hole = holeRef.current;
    const ring = ringRef.current;
    if (!hole) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    // The content area is the parent of the portal
    const contentArea = hole.parentElement as HTMLElement | null;
    if (!contentArea) return;

    function onMouseMove(e: MouseEvent) {
      if (!contentArea) return;
      const rect = contentArea.getBoundingClientRect();
      posRef.current.x = e.clientX - rect.left;
      posRef.current.y = e.clientY - rect.top;
      if (!activeRef.current) {
        posRef.current.sx = posRef.current.x;
        posRef.current.sy = posRef.current.y;
      }
      activeRef.current = true;
    }

    function onMouseLeave() {
      activeRef.current = false;
    }

    function tick(t: number) {
      if (!isVisibleRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      if (t - lastFrameRef.current < FRAME_INTERVAL) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameRef.current = t;

      const pos = posRef.current;
      pos.sx += (pos.x - pos.sx) * LERP;
      pos.sy += (pos.y - pos.sy) * LERP;

      const x = pos.sx;
      const y = pos.sy;

      if (hole) {
        if (activeRef.current) {
          // Invert the clip: show everything EXCEPT the circle
          // This punches a transparent hole in the background overlay
          const r = PORTAL_RADIUS;
          const xp = x.toFixed(1);
          const yp = y.toFixed(1);
          // Polygon that covers the full area with a circle cut out
          // Using CSS mask with inverted radial gradient
          const mask = `radial-gradient(circle ${r}px at ${xp}px ${yp}px, transparent ${r - 1}px, black ${r}px)`;
          hole.style.maskImage = mask;
          hole.style.webkitMaskImage = mask;
        } else {
          hole.style.maskImage = "none";
          hole.style.webkitMaskImage = "none";
        }
      }

      if (ring) {
        if (activeRef.current) {
          ring.style.visibility = "visible";
          ring.style.transform = `translate(${(x - PORTAL_RADIUS).toFixed(1)}px, ${(y - PORTAL_RADIUS).toFixed(1)}px)`;
        } else {
          ring.style.visibility = "hidden";
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    contentArea.addEventListener("mousemove", onMouseMove);
    contentArea.addEventListener("mouseleave", onMouseLeave);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(contentArea);

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      contentArea.removeEventListener("mousemove", onMouseMove);
      contentArea.removeEventListener("mouseleave", onMouseLeave);
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <>
      {/* Background fill with a circular hole cut out at cursor position.
          This covers the card background + overlay + grid. The hole
          lets the wave animation behind the terminal window show through. */}
      <div
        ref={holeRef}
        className="hidden md:block absolute inset-0 z-[5] pointer-events-none rounded-b-lg"
        aria-hidden="true"
        style={{
          background: "var(--card)",
        }}
      />
      {/* Grid overlay — also gets the hole punched through */}
      <div
        className="hidden md:block absolute inset-0 z-[6] pointer-events-none opacity-45"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Border ring */}
      <div
        ref={ringRef}
        className="hidden md:block absolute top-0 left-0 z-[52] pointer-events-none"
        aria-hidden="true"
        style={{
          visibility: "hidden",
          width: PORTAL_RADIUS * 2,
          height: PORTAL_RADIUS * 2,
          borderRadius: "50%",
          border: "1px solid var(--accent-400)",
          opacity: 0.5,
        }}
      />
    </>
  );
}
