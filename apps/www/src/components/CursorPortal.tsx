"use client";

import { useEffect, useRef } from "react";

const PORTAL_RADIUS = 50;
const LERP = 0.15;
const FRAME_INTERVAL = 1000 / 30;
const BORDER_COLOR = "rgba(97, 171, 234, 0.45)";

/**
 * CursorPortal: canvas-based see-through circle.
 *
 * Renders a canvas filled with the card background color, then clears
 * a perfect circle at the cursor position. This gives a pixel-sharp
 * hard-edge transparent hole that reveals the wave animation behind
 * the terminal window. A 1px accent border ring is drawn on the circle.
 *
 * No content displacement. No blur. Desktop only.
 */
export function CursorPortal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({ x: -999, y: -999, sx: -999, sy: -999 });
  const activeRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const isVisibleRef = useRef(true);
  const cardColorRef = useRef("#05070f");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const isMobile = window.matchMedia("(hover: none)").matches;
    if (isMobile) return;

    const contentArea = canvas.parentElement as HTMLElement | null;
    if (!contentArea) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function readCardColor() {
      cardColorRef.current = getComputedStyle(document.documentElement)
        .getPropertyValue("--card")
        .trim();
    }

    function setSize() {
      if (!canvas || !contentArea) return;
      const rect = contentArea.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

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

    function draw() {
      if (!ctx || !canvas || !contentArea) return;
      const { width, height } = contentArea.getBoundingClientRect();

      // Fill entire canvas with card+overlay color
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = cardColorRef.current;
      ctx.fillRect(0, 0, width, height);

      // Draw the overlay tint on top
      const overlayColor = document.documentElement.classList.contains("dark")
        ? "rgba(0, 0, 0, 0.4)"
        : "rgba(255, 255, 255, 0.4)";
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--grid-line")
          .trim() || "rgba(148, 163, 184, 0.07)";
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (activeRef.current) {
        const pos = posRef.current;
        const x = pos.sx;
        const y = pos.sy;

        // Cut the circle out — pixel-perfect hard edge
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, PORTAL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw border ring
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.arc(x, y, PORTAL_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = BORDER_COLOR;
        ctx.lineWidth = 1;
        ctx.stroke();
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
      pos.sx += (pos.x - pos.sx) * LERP;
      pos.sy += (pos.y - pos.sy) * LERP;

      draw();

      frameRef.current = requestAnimationFrame(tick);
    }

    readCardColor();
    setSize();
    draw(); // Initial frame — solid card color, no hole

    contentArea.addEventListener("mousemove", onMouseMove);
    contentArea.addEventListener("mouseleave", onMouseLeave);

    const resizeObserver = new ResizeObserver(() => {
      setSize();
      draw();
    });
    resizeObserver.observe(contentArea);

    const themeObserver = new MutationObserver(() => {
      readCardColor();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const visObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry) isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    visObserver.observe(contentArea);

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      contentArea.removeEventListener("mousemove", onMouseMove);
      contentArea.removeEventListener("mouseleave", onMouseLeave);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      visObserver.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hidden md:block absolute inset-0 z-[5] pointer-events-none"
      aria-hidden="true"
    />
  );
}
