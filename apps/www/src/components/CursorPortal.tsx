"use client";

import { useEffect, useRef } from "react";

const PORTAL_RADIUS = 120;
const INNER_STOP = 0.5; // fully transparent up to this fraction of radius

/**
 * CursorPortal: tracks cursor position on the terminal window and applies
 * a CSS mask that creates a transparent "hole" revealing the wavy background.
 *
 * The background mask layer sits between the waves (z:-10) and the content (z:3).
 * As the cursor moves, the mask opens a feathered circle, letting the waves show through.
 */
export function CursorPortal({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -999, y: -999, sx: -999, sy: -999 });
  const radiusRef = useRef(0); // animated radius (0 = closed, PORTAL_RADIUS = open)
  const activeRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const bg = bgRef.current;
    const grid = gridRef.current;
    if (!container || !bg || !grid) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    function onMouseMove(e: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      posRef.current.x = e.clientX - rect.left;
      posRef.current.y = e.clientY - rect.top + container.scrollTop;
      if (!activeRef.current) {
        posRef.current.sx = posRef.current.x;
        posRef.current.sy = posRef.current.y;
      }
      activeRef.current = true;
    }

    function onMouseLeave() {
      activeRef.current = false;
    }

    function applyMask(
      el: HTMLElement,
      x: number,
      y: number,
      r: number,
      innerFrac: number,
    ) {
      if (r < 0.5) {
        el.style.maskImage = "none";
        el.style.webkitMaskImage = "none";
        return;
      }
      const inner = Math.round(r * innerFrac);
      const outer = Math.round(r);
      const mask = `radial-gradient(circle ${outer}px at ${x}px ${y}px, transparent ${inner}px, black ${outer}px)`;
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
    }

    function tick() {
      if (!container || !bg || !grid) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!isVisibleRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const pos = posRef.current;
      pos.sx += (pos.x - pos.sx) * 0.12;
      pos.sy += (pos.y - pos.sy) * 0.12;

      // Animate radius open/closed
      const targetRadius = activeRef.current ? PORTAL_RADIUS : 0;
      radiusRef.current += (targetRadius - radiusRef.current) * 0.1;

      const x = Math.round(pos.sx * 10) / 10;
      const y = Math.round(pos.sy * 10) / 10;
      const r = radiusRef.current;

      // Apply mask to background layer (card color) - portal shows waves through
      applyMask(bg, x, y, r, INNER_STOP);
      // Grid gets a slightly tighter mask so grid lines fade first
      applyMask(grid, x, y, r * 1.1, 0.3);

      // Also set CSS vars for any children that want to know cursor position
      container.style.setProperty("--portal-x", `${x}px`);
      container.style.setProperty("--portal-y", `${y}px`);
      container.style.setProperty("--portal-r", `${r}px`);

      frameRef.current = requestAnimationFrame(tick);
    }

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(container);

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="cursor-portal-container relative">
      {/* Background layer: card color with portal hole punched through */}
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none z-[1]"
        aria-hidden="true"
        style={{ background: "var(--card)" }}
      />
      {/* Wave amplifier: bright glow visible only through the portal hole */}
      <div
        className="absolute inset-0 pointer-events-none z-[0]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 600px 400px at 50% 40%, rgba(97, 171, 234, 0.25), transparent 70%)",
        }}
      />
      {/* Grid overlay with portal hole */}
      <div
        ref={gridRef}
        className="absolute inset-0 pointer-events-none opacity-45 z-[2]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Content on top */}
      <div className="relative z-[3] px-6 md:px-10 min-h-[calc(100svh-9rem)] flex flex-col">
        {children}
      </div>
    </div>
  );
}
