"use client";

import { useRef, useEffect, useState } from "react";
import {
  prepareWithSegments,
  layoutNextLine,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext";

const FONT_SIZE = 18;
const LINE_HEIGHT = 28;
const FONT = `${FONT_SIZE}px 'JetBrains Mono', monospace`;
const AGENT_RADIUS = 65;
const AGENT_LABEL_FONT = `10px 'JetBrains Mono', monospace`;
const IDLE_TIMEOUT_MS = 2000;
const FRAME_INTERVAL = 1000 / 30;
const PARAGRAPH_GAP = LINE_HEIGHT;

interface AgentState {
  // Smoothed position (rendered)
  x: number;
  y: number;
  // Target position
  tx: number;
  ty: number;
  // Autonomous mode
  autonomous: boolean;
  autonomousTime: number;
  // Label
  label: string;
  labelOpacity: number;
  // Cursor tracking
  cursorInBounds: boolean;
}

interface PretextAboutProps {
  paragraphs: readonly string[];
}

function getColor(varName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
}

export function PretextAbout({ paragraphs }: PretextAboutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const preparedRef = useRef<PreparedTextWithSegments[]>([]);
  const agentRef = useRef<AgentState>({
    x: -200,
    y: -200,
    tx: -200,
    ty: -200,
    autonomous: false,
    autonomousTime: 0,
    label: "agent_0",
    labelOpacity: 0,
    cursorInBounds: false,
  });
  const frameIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const lastFrameTimeRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const colorsRef = useRef({ body: "#1e293b", faint: "#94a3b8" });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    ctxRef.current = canvas.getContext("2d");

    function readColors() {
      colorsRef.current = {
        body: getColor("--text-body"),
        faint: getColor("--text-faint"),
      };
    }

    function setSize() {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    function prepareParagraphs() {
      preparedRef.current = paragraphs.map((p) => prepareWithSegments(p, FONT));
    }

    function computeCanvasHeight(): number {
      const w = sizeRef.current.width;
      if (w <= 0) return 200;
      let totalLines = 0;
      for (const prepared of preparedRef.current) {
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
        let lines = 0;
        for (;;) {
          const line = layoutNextLine(prepared, cursor, w);
          if (!line) break;
          cursor = line.end;
          lines++;
        }
        totalLines += lines;
      }
      // paragraphs + gaps between them
      return (
        totalLines * LINE_HEIGHT +
        (preparedRef.current.length - 1) * PARAGRAPH_GAP
      );
    }

    function drawFrame(time: number) {
      const ctx = ctxRef.current;
      const { width } = sizeRef.current;
      if (!ctx || width <= 0) return;

      const agent = agentRef.current;

      // Lerp agent position toward target
      agent.x += (agent.tx - agent.x) * 0.1;
      agent.y += (agent.ty - agent.y) * 0.1;

      // Autonomous movement
      if (agent.autonomous) {
        agent.autonomousTime += 0.008;
        const t = agent.autonomousTime;
        const h = computeCanvasHeight();
        // Lissajous curve constrained to text bounds
        agent.tx =
          width * 0.5 + Math.sin(t * 1.3 + 0.7) * (width * 0.3 - AGENT_RADIUS);
        agent.ty = h * 0.5 + Math.sin(t * 0.9) * (h * 0.4 - AGENT_RADIUS);
        agent.label = "agent_0 [autonomous]";
        agent.labelOpacity = Math.min(1, agent.labelOpacity + 0.03);
      } else if (agent.cursorInBounds) {
        agent.labelOpacity = Math.min(1, agent.labelOpacity + 0.05);
      } else {
        agent.labelOpacity = Math.max(0, agent.labelOpacity - 0.05);
      }

      const canvasHeight = computeCanvasHeight();
      ctx.clearRect(0, 0, width, canvasHeight + 40);

      // Draw text with obstacle avoidance
      ctx.font = FONT;
      ctx.fillStyle = colorsRef.current.body;
      ctx.textBaseline = "top";

      let y = 0;
      for (let pIdx = 0; pIdx < preparedRef.current.length; pIdx++) {
        const prepared = preparedRef.current[pIdx];
        if (!prepared) continue;
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };

        for (;;) {
          const lineCenterY = y + LINE_HEIGHT / 2;
          const dy = Math.abs(lineCenterY - agent.y);
          let lineMaxWidth = width;
          let xOffset = 0;

          if (dy < AGENT_RADIUS && agent.cursorInBounds) {
            const exclusionHalf = Math.sqrt(
              AGENT_RADIUS * AGENT_RADIUS - dy * dy,
            );
            // Text goes to the side with more space
            if (agent.x > width / 2) {
              // Agent on right, text on left
              lineMaxWidth = Math.max(60, agent.x - exclusionHalf);
            } else {
              // Agent on left, text on right
              xOffset = Math.min(width - 60, agent.x + exclusionHalf);
              lineMaxWidth = Math.max(60, width - xOffset);
            }
          }

          const line = layoutNextLine(prepared, cursor, lineMaxWidth);
          if (!line) break;
          ctx.fillStyle = colorsRef.current.body;
          ctx.font = FONT;
          ctx.fillText(line.text, xOffset, y);
          cursor = line.end;
          y += LINE_HEIGHT;
        }

        // Gap between paragraphs
        if (pIdx < preparedRef.current.length - 1) {
          y += PARAGRAPH_GAP;
        }
      }

      // Draw agent circle
      if (agent.cursorInBounds && agent.labelOpacity > 0) {
        const pulse = 0.12 + Math.sin(time * 0.003) * 0.05;
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, AGENT_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(97, 171, 234, ${pulse * agent.labelOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Agent dot at center
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(97, 171, 234, ${0.5 * agent.labelOpacity})`;
        ctx.fill();

        // Label below circle
        ctx.font = AGENT_LABEL_FONT;
        ctx.fillStyle = `rgba(${hexToRgb(colorsRef.current.faint)}, ${0.8 * agent.labelOpacity})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(agent.label, agent.x, agent.y + AGENT_RADIUS + 6);
        ctx.textAlign = "start";
        ctx.textBaseline = "top";
      }
    }

    function tick(t: number) {
      if (!isVisibleRef.current) {
        frameIdRef.current = requestAnimationFrame(tick);
        return;
      }
      if (t - lastFrameTimeRef.current < FRAME_INTERVAL) {
        frameIdRef.current = requestAnimationFrame(tick);
        return;
      }
      lastFrameTimeRef.current = t;
      drawFrame(t);
      frameIdRef.current = requestAnimationFrame(tick);
    }

    function startIdleTimer() {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const agent = agentRef.current;
        if (agent.cursorInBounds) {
          agent.autonomous = true;
          agent.autonomousTime = 0;
        }
      }, IDLE_TIMEOUT_MS);
    }

    function onMouseMove(e: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const agent = agentRef.current;
      agent.tx = x;
      agent.ty = y;
      agent.cursorInBounds = true;

      if (agent.autonomous) {
        agent.autonomous = false;
        agent.label = "agent_0";
      }
      startIdleTimer();
    }

    function onMouseLeave() {
      const agent = agentRef.current;
      agent.cursorInBounds = false;
      agent.autonomous = false;
      agent.label = "agent_0";
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }

    function onResize() {
      setSize();
      if (container && canvasRef.current) {
        const h = computeCanvasHeight();
        container.style.height = `${h}px`;
        canvasRef.current.style.height = `${h}px`;
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.height = h * dpr;
        const ctx = ctxRef.current;
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    // Theme change observer
    const themeObserver = new MutationObserver(() => {
      readColors();
    });

    async function init() {
      await document.fonts.ready;
      readColors();
      prepareParagraphs();
      setSize();

      const h = computeCanvasHeight();
      if (container && canvas) {
        container.style.height = `${h}px`;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = sizeRef.current.width * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${sizeRef.current.width}px`;
        canvas.style.height = `${h}px`;
        const ctx = ctxRef.current;
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      setIsReady(true);

      if (prefersReducedMotion) {
        drawFrame(0);
        return;
      }

      frameIdRef.current = requestAnimationFrame(tick);

      container?.addEventListener("mousemove", onMouseMove);
      container?.addEventListener("mouseleave", onMouseLeave);

      const resizeObserver = new ResizeObserver(onResize);
      if (container) resizeObserver.observe(container);

      const visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry) isVisibleRef.current = entry.isIntersecting;
        },
        { threshold: 0 },
      );
      if (container) visibilityObserver.observe(container);

      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => {
        container?.removeEventListener("mousemove", onMouseMove);
        container?.removeEventListener("mouseleave", onMouseLeave);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        themeObserver.disconnect();
        if (frameIdRef.current !== null)
          cancelAnimationFrame(frameIdRef.current);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      };
    }

    const cleanupPromise = init();
    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [paragraphs]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Accessible text for screen readers and SEO */}
      <div className={isReady ? "sr-only" : undefined}>
        {paragraphs.map((line) => (
          <p
            key={line}
            className="text-body leading-relaxed text-base md:text-lg"
          >
            {line}
          </p>
        ))}
      </div>
      {/* Canvas overlay - hidden on mobile, visible on md+ */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`hidden md:block absolute inset-0 w-full h-full ${isReady ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      />
    </div>
  );
}

function hexToRgb(hex: string): string {
  // Handle rgb/rgba passthrough
  if (hex.startsWith("rgb")) {
    const match = hex.match(/[\d.]+/g);
    if (match && match.length >= 3)
      return `${match[0]}, ${match[1]}, ${match[2]}`;
  }
  // Handle hex
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}
