"use client";

import { useEffect, useRef } from "react";
import {
  prepareWithSegments,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext";

const OBSTACLE_PADDING = 8;
const MIN_SLOT_WIDTH = 24;

type Interval = { left: number; right: number };
type Point = { x: number; y: number };

// From Pretext source (wrap-geometry.ts)
function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots: Interval[] = [base];
  for (const interval of blocked) {
    const next: Interval[] = [];
    for (const slot of slots) {
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot);
        continue;
      }
      if (interval.left > slot.left)
        next.push({ left: slot.left, right: interval.left });
      if (interval.right < slot.right)
        next.push({ left: interval.right, right: slot.right });
    }
    slots = next;
  }
  return slots.filter((s) => s.right - s.left >= MIN_SLOT_WIDTH);
}

// From Pretext source: get polygon x-intersections at a given y scanline
function getPolygonXsAtY(points: Point[], y: number): number[] {
  const xs: number[] = [];
  let a = points[points.length - 1];
  if (!a) return xs;
  for (let i = 0; i < points.length; i++) {
    const b = points[i]!;
    if ((a.y <= y && y < b.y) || (b.y <= y && y < a.y)) {
      xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    a = b;
  }
  xs.sort((a2, b2) => a2 - b2);
  return xs;
}

// From Pretext source: get blocked interval for a polygon at a line band
function getPolygonIntervalForBand(
  points: Point[],
  bandTop: number,
  bandBottom: number,
  padding: number,
): Interval | null {
  let left = Infinity,
    right = -Infinity;
  const startY = Math.floor(bandTop - padding);
  const endY = Math.ceil(bandBottom + padding);
  for (let y = startY; y <= endY; y++) {
    const xs = getPolygonXsAtY(points, y + 0.5);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      if (xs[i]! < left) left = xs[i]!;
      if (xs[i + 1]! > right) right = xs[i + 1]!;
    }
  }
  if (!Number.isFinite(left)) return null;
  return { left: left - padding, right: right + padding };
}

// Generate the spade polygon points in world coordinates
function getSpadePolygon(
  cx: number,
  cy: number,
  size: number,
  angle: number,
): Point[] {
  // Same spade path as FerrofluidBorder drawSpade, sampled as polygon points
  const s = size / 18;
  const cos = Math.cos(angle - Math.PI / 2);
  const sin = Math.sin(angle - Math.PI / 2);
  // Define spade outline as points (matching the bezier path approximately)
  const raw: [number, number][] = [
    [0, -18],
    [-4, -15],
    [-9, -11],
    [-13, -7],
    [-15, -2],
    [-15, 2],
    [-14, 5],
    [-11, 7],
    [-7, 8],
    [-4, 7],
    [-2, 7],
    [-2, 9],
    [-6, 16],
    [0, 16],
    [6, 16],
    [2, 9],
    [2, 7],
    [4, 7],
    [7, 8],
    [11, 7],
    [14, 5],
    [15, 2],
    [15, -2],
    [13, -7],
    [9, -11],
    [4, -15],
    [0, -18],
  ];
  return raw.map(([lx, ly]) => {
    const sx = lx * s,
      sy = ly * s;
    return { x: cx + sx * cos - sy * sin, y: cy + sx * sin + sy * cos };
  });
}

interface TextBlock {
  el: HTMLElement;
  text: string;
  prepared: PreparedTextWithSegments;
  font: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
  color: string;
  paddingTop: number;
  paddingLeft: number;
  paddingRight: number;
  rect: DOMRect;
}

/**
 * PretextFlow: dragon-demo-style both-side text reflow using
 * carveTextLineSlots from Pretext's own source. Text flows on
 * both sides of the spade cursor simultaneously.
 */
export function PretextFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const blocksRef = useRef<TextBlock[]>([]);
  const isVisibleRef = useRef(true);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cvs = canvasRef.current!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = cvs.getContext("2d")!;

    function setSize() {
      const dpr = window.devicePixelRatio || 1;
      cvs.width = window.innerWidth * dpr;
      cvs.height = window.innerHeight * dpr;
      cvs.style.width = `${window.innerWidth}px`;
      cvs.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function scanBlocks() {
      const contentArea =
        document.querySelector(".portal-content") ||
        document.querySelector("main");
      if (!contentArea) return;
      const els = contentArea.querySelectorAll<HTMLElement>(
        "h1, h2, h3, p, [data-flow]",
      );
      blocksRef.current = [];

      els.forEach((el) => {
        // innerText returns rendered text (respects text-transform, visibility, etc.)
        const text = el.innerText || "";
        if (!text.trim()) return;
        // Skip interactive/complex components - their text stays as DOM
        if (
          el.closest("button") ||
          el.closest("input") ||
          el.closest("nav") ||
          el.closest("[role='button']") ||
          el.closest("form") ||
          el.closest("footer") ||
          el.closest(".terminal-header") ||
          el.closest("[data-no-flow]")
        )
          return;

        const style = getComputedStyle(el);
        const letterSpacing = style.letterSpacing;
        // Include letter-spacing in font measurement for accurate width calculation
        const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const color = style.color;
        const fontSize = parseFloat(style.fontSize);
        const lineHeight =
          style.lineHeight === "normal"
            ? fontSize * 1.2
            : parseFloat(style.lineHeight);
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;

        try {
          const prepared = prepareWithSegments(text, font);
          blocksRef.current.push({
            el,
            text,
            prepared,
            font,
            fontSize,
            lineHeight,
            letterSpacing,
            color,
            paddingTop,
            paddingLeft,
            paddingRight,
            rect: el.getBoundingClientRect(),
          });
        } catch {
          // Font not loaded
        }
      });
    }

    function drawFlow() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const root = document.documentElement.style;
      const cx = parseFloat(root.getPropertyValue("--ferro-cx") || "-999");
      const cy = parseFloat(root.getPropertyValue("--ferro-cy") || "-999");
      const cr = parseFloat(root.getPropertyValue("--ferro-r") || "0");
      const spadeSize = parseFloat(
        root.getPropertyValue("--ferro-spade-r") || "0",
      );
      const spadeAngle = parseFloat(
        root.getPropertyValue("--ferro-angle") || "0",
      );

      // Build the spade polygon for obstacle exclusion
      const spadePolygon =
        spadeSize > 2 ? getSpadePolygon(cx, cy, spadeSize, spadeAngle) : [];

      if (cr < 1 || spadeSize < 2) {
        blocksRef.current.forEach((b) => {
          b.el.style.visibility = "";
        });
        return;
      }

      for (const block of blocksRef.current) {
        const {
          rect,
          prepared,
          font,
          fontSize,
          lineHeight: lineH,
          color,
          paddingTop,
          paddingLeft,
          paddingRight,
        } = block;

        const contentLeft = rect.left + paddingLeft;
        const contentTop = rect.top + paddingTop;
        const contentWidth = rect.width - paddingLeft - paddingRight;
        const contentRight = contentLeft + contentWidth;

        // Proximity check
        const blockCx = rect.left + rect.width / 2;
        const blockCy = rect.top + rect.height / 2;
        const distToBlock = Math.hypot(cx - blockCx, cy - blockCy);
        const blockRadius = Math.hypot(rect.width, rect.height) / 2;

        if (distToBlock > blockRadius + spadeSize + 80) {
          block.el.style.visibility = "";
          continue;
        }

        block.el.style.visibility = "hidden";

        // Clip to element bounds so reflowed text can't bleed into adjacent elements
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.left, rect.top, rect.width, rect.height);
        ctx.clip();

        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textBaseline = "top";
        // Match CSS letter-spacing for accurate character positioning
        (ctx as unknown as Record<string, string>).letterSpacing =
          block.letterSpacing === "normal" ? "0px" : block.letterSpacing;
        const textTopOffset = (lineH - fontSize) / 2;

        let textCursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
        let y = contentTop;
        const base: Interval = { left: contentLeft, right: contentRight };

        while (y < rect.bottom) {
          const bandTop = y;
          const bandBottom = y + lineH;

          const blocked: Interval[] = [];
          if (spadePolygon.length > 2) {
            const obstacleInterval = getPolygonIntervalForBand(
              spadePolygon,
              bandTop,
              bandBottom,
              OBSTACLE_PADDING,
            );
            if (obstacleInterval) blocked.push(obstacleInterval);
          }

          const slots = carveTextLineSlots(base, blocked);

          if (slots.length === 0) {
            y += lineH;
            continue;
          }

          for (const slot of slots) {
            const slotWidth = slot.right - slot.left;
            const line = layoutNextLine(prepared, textCursor, slotWidth);
            if (!line) break;
            ctx.fillText(line.text, slot.left, y + textTopOffset);
            textCursor = line.end;
          }

          y += lineH;
        }

        ctx.restore();
      }
    }

    function tick() {
      if (!isVisibleRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      // Keep canvas viewport-aligned; absolute position means it rubber-bands with content
      cvs.style.transform = `translateY(${window.scrollY}px)`;

      // During scroll: freeze canvas (just update transform, skip redraw)
      if (isScrollingRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      blocksRef.current.forEach((b) => {
        b.rect = b.el.getBoundingClientRect();
      });
      drawFlow();
      frameRef.current = requestAnimationFrame(tick);
    }

    document.fonts.ready.then(() => {
      setSize();
      scanBlocks();
      window.addEventListener("resize", () => {
        setSize();
        scanBlocks();
      });

      // Track scroll state: disable pretext during scroll, re-enable after idle
      let scrollTimer: ReturnType<typeof setTimeout>;
      window.addEventListener(
        "scroll",
        () => {
          isScrollingRef.current = true;
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => {
            isScrollingRef.current = false;
          }, 120);
        },
        { passive: true },
      );

      const onVis = () => {
        isVisibleRef.current = document.visibilityState === "visible";
      };
      document.addEventListener("visibilitychange", onVis);
      const rescanInterval = setInterval(scanBlocks, 3000);
      frameRef.current = requestAnimationFrame(tick);
      return () => {
        document.removeEventListener("visibilitychange", onVis);
        clearInterval(rescanInterval);
      };
    });

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      blocksRef.current.forEach((b) => {
        b.el.style.visibility = "";
      });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hidden md:block absolute top-0 left-0 z-[20] pointer-events-none"
      aria-hidden="true"
    />
  );
}
