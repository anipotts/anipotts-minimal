"use client";

import { useEffect, useRef, useCallback } from "react";
import { WavesBackground } from "@anipotts/ui";

const PORTAL_RADIUS = 140;
const LERP = 0.12;
const FRAME_INTERVAL = 1000 / 30;
const REPEL_RADIUS = 180;
const REPEL_STRENGTH = 30;

/**
 * CursorPortal: Lando Norris-style mask reveal.
 *
 * A high-z overlay containing the wave background, masked to a circle
 * at the cursor position. Sits on TOP of all content so the cursor
 * "reveals" the animated waves through the page. Also applies CSS
 * transform displacement to nearby text elements for a flow effect.
 *
 * Desktop only. No-op on mobile/reduced-motion.
 */
export function CursorPortal() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -999, y: -999, sx: -999, sy: -999 });
  const activeRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const isVisibleRef = useRef(true);
  const flowEls = useRef<HTMLElement[]>([]);
  const flowRectsRef = useRef<DOMRect[]>([]);
  const scrollYRef = useRef(0);
  const contentRef = useRef<HTMLElement | null>(null);

  const refreshFlowElements = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    // Select all text-bearing elements for displacement
    const els = content.querySelectorAll<HTMLElement>(
      "h1, h2, h3, p, a, span, article, [data-flow]",
    );
    flowEls.current = Array.from(els).filter((el) => {
      // Skip elements inside PretextAbout (it handles its own reflow)
      if (el.closest("[data-pretext]")) return false;
      // Skip tiny elements (labels, icons)
      const rect = el.getBoundingClientRect();
      return rect.width > 20 && rect.height > 10;
    });
    flowRectsRef.current = flowEls.current.map((el) =>
      el.getBoundingClientRect(),
    );
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    // Find the terminal window and content area
    const terminalWindow = overlay.closest(
      ".terminal-window",
    ) as HTMLElement | null;
    if (!terminalWindow) return;
    const contentArea = overlay.parentElement?.querySelector(
      ".portal-content",
    ) as HTMLElement | null;
    contentRef.current = contentArea;

    // Initial scan of flow elements
    refreshFlowElements();

    function onMouseMove(e: MouseEvent) {
      if (!terminalWindow) return;
      const rect = terminalWindow.getBoundingClientRect();
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

    function onScroll() {
      scrollYRef.current = window.scrollY;
      // Refresh rects on scroll
      flowRectsRef.current = flowEls.current.map((el) =>
        el.getBoundingClientRect(),
      );
    }

    function displaceElements() {
      if (!terminalWindow) return;
      const twRect = terminalWindow.getBoundingClientRect();
      // Cursor in viewport coords
      const cx = twRect.left + posRef.current.sx;
      const cy = twRect.top + posRef.current.sy;

      for (let i = 0; i < flowEls.current.length; i++) {
        const el = flowEls.current[i];
        if (!el) continue;
        const rect = flowRectsRef.current[i];
        if (!rect) continue;

        // Element center
        const ecx = rect.left + rect.width / 2;
        const ecy = rect.top + rect.height / 2;
        const dx = ecx - cx;
        const dy = ecy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && activeRef.current) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);
          const tx = Math.cos(angle) * force;
          const ty = Math.sin(angle) * force;
          el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
          el.style.transition = "transform 0.08s ease-out";
        } else {
          if (el.style.transform !== "") {
            el.style.transform = "";
            el.style.transition = "transform 0.3s ease-out";
          }
        }
      }
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

      if (activeRef.current) {
        pos.sx += (pos.x - pos.sx) * LERP;
        pos.sy += (pos.y - pos.sy) * LERP;
      } else {
        // Shrink radius when inactive (handled via opacity below)
      }

      const x = pos.sx;
      const y = pos.sy;

      // Apply mask to overlay
      if (overlay) {
        if (activeRef.current) {
          const inner = Math.round(PORTAL_RADIUS * 0.6);
          const outer = PORTAL_RADIUS;
          overlay.style.maskImage = `radial-gradient(circle ${outer}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, black ${inner}px, transparent ${outer}px)`;
          overlay.style.webkitMaskImage = overlay.style.maskImage;
          overlay.style.opacity = "1";
        } else {
          overlay.style.opacity = "0";
        }
      }

      // Displace text elements
      displaceElements();

      frameRef.current = requestAnimationFrame(tick);
    }

    terminalWindow.addEventListener("mousemove", onMouseMove);
    terminalWindow.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(overlay);

    // Refresh flow elements periodically (handles dynamic content)
    const refreshInterval = setInterval(refreshFlowElements, 2000);

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      terminalWindow.removeEventListener("mousemove", onMouseMove);
      terminalWindow.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      clearInterval(refreshInterval);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // Clean up transforms
      flowEls.current.forEach((el) => {
        el.style.transform = "";
        el.style.transition = "";
      });
    };
  }, [refreshFlowElements]);

  return (
    <div
      ref={overlayRef}
      className="hidden md:block absolute inset-0 z-[50] pointer-events-none overflow-hidden rounded-b-lg"
      aria-hidden="true"
      style={{
        opacity: "0",
        transition: "opacity 0.3s ease-out",
        maskImage: "none",
        WebkitMaskImage: "none",
      }}
    >
      {/* Dark base matching page background */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--background)" }}
      />
      {/* Ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, var(--ambient-from), var(--background), var(--background))",
        }}
      />
      {/* Noise texture */}
      <div
        className="absolute inset-0 bg-noise mix-blend-overlay"
        style={{ opacity: "var(--noise-opacity)" }}
      />
      {/* Wave animation - higher opacity for portal visibility */}
      <div className="absolute inset-0" style={{ opacity: 0.7 }}>
        <WavesBackground />
      </div>
    </div>
  );
}
