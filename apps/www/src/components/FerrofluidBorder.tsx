"use client";

import { useEffect, useRef } from "react";

// ── Animation constants ──
const FERRO = {
  // Core magnet
  magnetRadius: 80,
  magnetStrength: 12,
  bubbleRadius: 22,
  snapDepth: 90,
  mouseLerp: 0.35,
  angleLerp: 0.2,

  // Window border
  borderPoints: 240,
  borderColor: "rgba(97, 171, 234, 0.3)",

  // Spade cursor
  spadeSize: 28,
  spadeDissolveDist: 30,
  spadeBubbleDepth: 40,

  // Cursor glow
  glowRadius: 90,
  glowStops: [0.14, 0.07, 0] as const,

  // Cards
  cardBorderPoints: 80,
  cardCornerRadius: 3,
  cardRescanInterval: 60,
  cardHoverThreshold: 0.05,
  cardHoverBoost: 1.5,
  cardIdleAlpha: 0.25,
  cardHoverAlphaRange: 0.75,

  // Buttons/inputs (multipliers of core values)
  buttonRadiusMul: 0.5,
  buttonStrengthMul: 0.35,

  // Nav underlines
  navRadiusMul: 0.5,
  navStrengthMul: 0.35,
  navPoints: 30,
  navActiveAlpha: 0.7,
  navHoverAlpha: 0.5,
  navLineWidth: 1.5,

  // Grid overlay
  gridSpacing: 24,
  gridAlpha: 0.45,

  // Accent color (shared with Waves component)
  accent: { r: 97, g: 171, b: 234 },
} as const;

type Pt = { bx: number; by: number };

// ── Shared helpers ──

const rgba = (a: number) =>
  `rgba(${FERRO.accent.r}, ${FERRO.accent.g}, ${FERRO.accent.b}, ${a})`;

function displacePoints(
  pts: Pt[],
  mx: number,
  my: number,
  radius: number,
  strength: number,
): Pt[] {
  return pts.map((pt) => {
    const dx = mx - pt.bx,
      dy = my - pt.by;
    const dist = Math.hypot(dx, dy);
    if (dist >= radius || dist === 0) return pt;
    const t = 1 - dist / radius;
    const ease = t * t * t * (t * (t * 6 - 15) + 10); // quintic smoothstep
    const s = ease * strength;
    const angle = Math.atan2(dy, dx);
    return {
      bx: pt.bx + Math.cos(angle) * s,
      by: pt.by + Math.sin(angle) * s,
    };
  });
}

function traceClosedPath(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  const n = pts.length;
  if (n < 2) return;
  ctx.beginPath();
  ctx.moveTo((pts[0]!.bx + pts[1]!.bx) / 2, (pts[0]!.by + pts[1]!.by) / 2);
  for (let i = 1; i <= n; i++) {
    const c = pts[i % n]!,
      nx = pts[(i + 1) % n]!;
    ctx.quadraticCurveTo(c.bx, c.by, (c.bx + nx.bx) / 2, (c.by + nx.by) / 2);
  }
  ctx.closePath();
}

function rectEdgeDist(
  mx: number,
  my: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
): number {
  const dL = mx - left,
    dR = right - mx,
    dT = my - top,
    dB = bottom - my;
  if (dL > 0 && dR > 0 && dT > 0 && dB > 0) return -Math.min(dL, dR, dT, dB);
  return Math.hypot(
    Math.max(left - mx, 0, mx - right),
    Math.max(top - my, 0, my - bottom),
  );
}

// ── Spade shape points ──
const SPADE_PTS: [number, number][] = [
  [0, -18],
  [-2, -16],
  [-5, -13],
  [-9, -10],
  [-12, -7],
  [-14, -4],
  [-15, -2],
  [-15, 1],
  [-14, 4],
  [-12, 6],
  [-9, 8],
  [-6, 8],
  [-4, 7],
  [-3, 7],
  [-2, 7],
  [-2, 9],
  [-4, 12],
  [-6, 16],
  [0, 16],
  [6, 16],
  [4, 12],
  [2, 9],
  [2, 7],
  [3, 7],
  [4, 7],
  [6, 8],
  [9, 8],
  [12, 6],
  [14, 4],
  [15, 1],
  [15, -2],
  [14, -4],
  [12, -7],
  [9, -10],
  [5, -13],
  [2, -16],
  [0, -18],
];

function buildSpadePath(
  x: number,
  y: number,
  angle: number,
  size: number,
): Path2D {
  const s = size / 18;
  const cos = Math.cos(angle - Math.PI / 2);
  const sin = Math.sin(angle - Math.PI / 2);
  const n = SPADE_PTS.length;

  const worldPts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const [lx, ly] = SPADE_PTS[i]!;
    const px = lx * s,
      py = ly * s;
    worldPts.push({ x: x + px * cos - py * sin, y: y + px * sin + py * cos });
  }

  const path = new Path2D();
  const first = worldPts[0]!,
    second = worldPts[1]!;
  path.moveTo((first.x + second.x) / 2, (first.y + second.y) / 2);
  for (let i = 1; i <= n; i++) {
    const curr = worldPts[i % n]!,
      next = worldPts[(i + 1) % n]!;
    path.quadraticCurveTo(
      curr.x,
      curr.y,
      (curr.x + next.x) / 2,
      (curr.y + next.y) / 2,
    );
  }
  path.closePath();
  return path;
}

export function FerrofluidBorder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({
    x: -999,
    y: -999,
    sx: -999,
    sy: -999,
    lx: -999,
    ly: -999,
    set: false,
  });
  const angleRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const winRectRef = useRef({ x: 0, y: 0, w: 0, h: 0, r: 8 });
  const cachedBorderPtsRef = useRef<Pt[]>([]);
  const cachedCardsRef = useRef<HTMLElement[]>([]);
  const cachedNavRef = useRef<HTMLElement[]>([]);
  const cardScanFrameRef = useRef(0);
  const cardColorRef = useRef("#05070f");
  const gridColorRef = useRef("rgba(148, 163, 184, 0.07)");
  const lastCssVarsRef = useRef({ cx: 0, cy: 0, r: 0, sr: 0, a: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const cvs = canvasRef.current;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = cvs.getContext("2d")!;

    function readColors() {
      const s = getComputedStyle(document.documentElement);
      cardColorRef.current = s.getPropertyValue("--card").trim();
      gridColorRef.current =
        s.getPropertyValue("--grid-line").trim() || "rgba(148, 163, 184, 0.07)";
    }

    function measureWindow() {
      const tw = document.querySelector(".terminal-window");
      if (!tw) return;
      const r = tw.getBoundingClientRect();
      winRectRef.current = {
        x: r.left,
        y: r.top,
        w: r.width,
        h: r.height,
        r: 8,
      };
      cachedBorderPtsRef.current = getRectPts();
    }

    function setSize() {
      const dpr = window.devicePixelRatio || 1;
      cvs.width = window.innerWidth * dpr;
      cvs.height = window.innerHeight * dpr;
      cvs.style.width = `${window.innerWidth}px`;
      cvs.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureWindow();
    }

    function signedDepth() {
      const { x, y, w, h } = winRectRef.current;
      const m = mouseRef.current;
      return Math.min(m.sx - x, x + w - m.sx, m.sy - y, y + h - m.sy);
    }

    function getRectPts(): Pt[] {
      const { x, y, w, h, r } = winRectRef.current;
      const pts: Pt[] = [];
      const perim = 2 * (w + h - 4 * r) + 2 * Math.PI * r;
      const step = perim / FERRO.borderPoints;
      const segs = [
        { sx: x + r, sy: y, ex: x + w - r, ey: y },
        { cx: x + w - r, cy: y + r, sa: -Math.PI / 2, ea: 0, r },
        { sx: x + w, sy: y + r, ex: x + w, ey: y + h - r },
        { cx: x + w - r, cy: y + h - r, sa: 0, ea: Math.PI / 2, r },
        { sx: x + w - r, sy: y + h, ex: x + r, ey: y + h },
        { cx: x + r, cy: y + h - r, sa: Math.PI / 2, ea: Math.PI, r },
        { sx: x, sy: y + h - r, ex: x, ey: y + r },
        { cx: x + r, cy: y + r, sa: Math.PI, ea: Math.PI * 1.5, r },
      ];
      for (const s of segs) {
        if ("r" in s && s.cx !== undefined) {
          const arcLen = s.r * Math.abs(s.ea - s.sa);
          const n = Math.max(2, Math.round(arcLen / step));
          for (let i = 0; i <= n; i++) {
            const a = s.sa + (s.ea - s.sa) * (i / n);
            pts.push({
              bx: s.cx + Math.cos(a) * s.r,
              by: s.cy + Math.sin(a) * s.r,
            });
          }
        } else if ("sx" in s) {
          const len = Math.hypot(s.ex - s.sx, s.ey - s.sy);
          const n = Math.max(1, Math.round(len / step));
          for (let i = 0; i <= n; i++) {
            const t = i / n;
            pts.push({
              bx: s.sx + (s.ex - s.sx) * t,
              by: s.sy + (s.ey - s.sy) * t,
            });
          }
        }
      }
      return pts;
    }

    function drawFrame(): number {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const m = mouseRef.current;
      const depth = m.set ? signedDepth() : -999;
      const borderPts = cachedBorderPtsRef.current;

      // ── Window border deformation ──
      const insideFade =
        depth > 0 ? Math.max(0, 1 - depth / FERRO.snapDepth) : 1;
      const displaced = m.set
        ? displacePoints(
            borderPts,
            m.sx,
            m.sy,
            FERRO.magnetRadius,
            FERRO.magnetStrength * insideFade,
          )
        : borderPts;

      // Fill + grid
      traceClosedPath(ctx, displaced);
      ctx.fillStyle = cardColorRef.current;
      ctx.fill();

      const wr = winRectRef.current;
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = gridColorRef.current;
      ctx.globalAlpha = FERRO.gridAlpha;
      ctx.lineWidth = 1;
      for (let gx = wr.x; gx <= wr.x + wr.w; gx += FERRO.gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(Math.round(gx) + 0.5, wr.y);
        ctx.lineTo(Math.round(gx) + 0.5, wr.y + wr.h);
        ctx.stroke();
      }
      for (let gy = wr.y; gy <= wr.y + wr.h; gy += FERRO.gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(wr.x, Math.round(gy) + 0.5);
        ctx.lineTo(wr.x + wr.w, Math.round(gy) + 0.5);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // Border stroke
      traceClosedPath(ctx, displaced);
      ctx.strokeStyle = FERRO.borderColor;
      ctx.stroke();

      // ── Cursor glow ──
      if (m.set) {
        const glowR = FERRO.glowRadius;
        const grad = ctx.createRadialGradient(m.sx, m.sy, 0, m.sx, m.sy, glowR);
        grad.addColorStop(0, rgba(FERRO.glowStops[0]));
        grad.addColorStop(0.5, rgba(FERRO.glowStops[1]));
        grad.addColorStop(1, rgba(FERRO.glowStops[2]));
        ctx.fillStyle = grad;
        ctx.fillRect(m.sx - glowR, m.sy - glowR, glowR * 2, glowR * 2);
      }

      // ── Card + nav rescan ──
      cardScanFrameRef.current++;
      if (
        cardScanFrameRef.current >= FERRO.cardRescanInterval ||
        cachedCardsRef.current.length === 0
      ) {
        cardScanFrameRef.current = 0;
        const els = document.querySelectorAll<HTMLElement>(
          ".portal-content .rounded-md, .portal-content button, .portal-content a.rounded-sm, .portal-content input.rounded-sm",
        );
        cachedCardsRef.current = Array.from(els).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width >= 30 && r.height >= 20;
        });
        cachedNavRef.current = Array.from(
          document.querySelectorAll<HTMLElement>("[data-ferro-nav]"),
        );
      }

      // ── Card ferrofluid borders ──
      let nearestCardDist = Infinity;

      for (const el of cachedCardsRef.current) {
        const cr = el.getBoundingClientRect();
        if (cr.bottom < 0 || cr.top > window.innerHeight) continue;

        const isButton =
          el.tagName === "BUTTON" || el.tagName === "INPUT" || cr.height < 50;
        const elMagnetR = isButton
          ? FERRO.magnetRadius * FERRO.buttonRadiusMul
          : FERRO.magnetRadius;
        const elMagnetStr = isButton
          ? FERRO.magnetStrength * FERRO.buttonStrengthMul
          : FERRO.magnetStrength;

        const edgeDist = rectEdgeDist(
          m.sx,
          m.sy,
          cr.left,
          cr.top,
          cr.right,
          cr.bottom,
        );
        if (edgeDist < nearestCardDist) nearestCardDist = edgeDist;

        const cardR = FERRO.cardCornerRadius;
        const cardPts: Pt[] = [];
        const perim = 2 * (cr.width + cr.height);
        const step = perim / FERRO.cardBorderPoints;

        for (let px = cr.left + cardR; px <= cr.right - cardR; px += step)
          cardPts.push({ bx: px, by: cr.top });
        for (let py = cr.top + cardR; py <= cr.bottom - cardR; py += step)
          cardPts.push({ bx: cr.right, by: py });
        for (let px = cr.right - cardR; px >= cr.left + cardR; px -= step)
          cardPts.push({ bx: px, by: cr.bottom });
        for (let py = cr.bottom - cardR; py >= cr.top + cardR; py -= step)
          cardPts.push({ bx: cr.left, by: py });

        const cardDisplaced = displacePoints(
          cardPts,
          m.sx,
          m.sy,
          elMagnetR,
          elMagnetStr,
        );
        const hoverT =
          edgeDist < elMagnetR ? Math.pow(1 - edgeDist / elMagnetR, 2) : 0;

        if (cardDisplaced.length > 2) {
          traceClosedPath(ctx, cardDisplaced);

          if (hoverT > FERRO.cardHoverThreshold) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.globalAlpha = Math.min(1, hoverT * FERRO.cardHoverBoost);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
          }

          const borderAlpha =
            FERRO.cardIdleAlpha + hoverT * FERRO.cardHoverAlphaRange;
          ctx.strokeStyle = rgba(borderAlpha);
          ctx.stroke();
        }
      }

      // ── Nav item ferrofluid underlines ──
      const NAV_MAGNET_R = FERRO.magnetRadius * FERRO.navRadiusMul;
      const NAV_MAGNET_STR = FERRO.magnetStrength * FERRO.navStrengthMul;

      for (const navEl of cachedNavRef.current) {
        const nr = navEl.getBoundingClientRect();
        if (nr.bottom < 0 || nr.top > window.innerHeight) continue;

        const isActive = navEl.hasAttribute("data-ferro-active");
        const navEdgeDist = rectEdgeDist(
          m.sx,
          m.sy,
          nr.left,
          nr.top,
          nr.right,
          nr.bottom,
        );
        if (navEdgeDist < nearestCardDist) nearestCardDist = navEdgeDist;

        const navHoverT =
          navEdgeDist < NAV_MAGNET_R
            ? Math.pow(1 - navEdgeDist / NAV_MAGNET_R, 2)
            : 0;
        if (!isActive && navHoverT < 0.01) continue;

        const bottomY = nr.bottom;
        const navPts: Pt[] = [];
        const navStep = nr.width / FERRO.navPoints;
        for (let px = nr.left; px <= nr.right; px += navStep) {
          navPts.push({ bx: px, by: bottomY });
        }
        navPts.push({ bx: nr.right, by: bottomY });

        const navDisplaced = displacePoints(
          navPts,
          m.sx,
          m.sy,
          NAV_MAGNET_R,
          NAV_MAGNET_STR,
        );

        if (navDisplaced.length > 1) {
          ctx.beginPath();
          ctx.moveTo(navDisplaced[0]!.bx, navDisplaced[0]!.by);
          for (let i = 1; i < navDisplaced.length; i++) {
            const prev = navDisplaced[i - 1]!,
              curr = navDisplaced[i]!;
            ctx.quadraticCurveTo(
              prev.bx,
              prev.by,
              (prev.bx + curr.bx) / 2,
              (prev.by + curr.by) / 2,
            );
          }
          const last = navDisplaced[navDisplaced.length - 1]!;
          ctx.lineTo(last.bx, last.by);

          const alpha = isActive
            ? FERRO.navActiveAlpha
            : navHoverT * FERRO.navHoverAlpha;
          ctx.strokeStyle = rgba(alpha);
          ctx.lineWidth = FERRO.navLineWidth;
          ctx.stroke();
        }
      }

      // ── Spade cursor ──
      if (!m.set || depth < -5) return depth;
      const bubbleT = Math.max(0, Math.min(1, depth / FERRO.spadeBubbleDepth));
      let spadeScale = bubbleT * FERRO.spadeSize;
      if (spadeScale < 1) return depth;

      if (nearestCardDist < FERRO.spadeDissolveDist) {
        spadeScale *= Math.max(0, nearestCardDist / FERRO.spadeDissolveDist);
      }
      if (spadeScale < 1) return depth;

      const spadePath = buildSpadePath(
        m.sx,
        m.sy,
        angleRef.current,
        spadeScale,
      );
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "black";
      ctx.fill(spadePath);
      ctx.globalCompositeOperation = "source-over";

      ctx.strokeStyle = FERRO.borderColor;
      ctx.lineWidth = 1;
      ctx.stroke(spadePath);

      return depth;
    }

    function tick() {
      if (!isVisibleRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      cvs.style.transform = `translateY(${window.scrollY}px)`;
      measureWindow();

      const m = mouseRef.current;
      m.sx += (m.x - m.sx) * FERRO.mouseLerp;
      m.sy += (m.y - m.sy) * FERRO.mouseLerp;

      const vx = m.sx - m.lx,
        vy = m.sy - m.ly;
      const speed = Math.hypot(vx, vy);
      if (speed > 0.5) {
        const targetAngle = Math.atan2(vy, vx);
        let diff = targetAngle - angleRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        angleRef.current += diff * FERRO.angleLerp;
      }
      m.lx = m.sx;
      m.ly = m.sy;

      const depth = drawFrame();

      // Publish cursor state as CSS custom props (only when changed)
      const bubbleT = Math.max(0, Math.min(1, depth / FERRO.spadeBubbleDepth));
      const bubbleR = bubbleT * FERRO.bubbleRadius;
      const rawSpadeScale = bubbleT * FERRO.spadeSize;
      const last = lastCssVarsRef.current;
      const cx = Math.round(m.sx * 10) / 10;
      const cy = Math.round(m.sy * 10) / 10;
      const rr = Math.round(bubbleR * 10) / 10;
      const sr = Math.round(rawSpadeScale * 10) / 10;
      const aa = Math.round(angleRef.current * 100) / 100;
      const root = document.documentElement;
      if (cx !== last.cx) {
        root.style.setProperty("--ferro-cx", `${cx}`);
        last.cx = cx;
      }
      if (cy !== last.cy) {
        root.style.setProperty("--ferro-cy", `${cy}`);
        last.cy = cy;
      }
      if (rr !== last.r) {
        root.style.setProperty("--ferro-r", `${rr}`);
        last.r = rr;
      }
      if (sr !== last.sr) {
        root.style.setProperty("--ferro-spade-r", `${sr}`);
        last.sr = sr;
      }
      if (aa !== last.a) {
        root.style.setProperty("--ferro-angle", `${aa}`);
        last.a = aa;
      }

      frameRef.current = requestAnimationFrame(tick);
    }

    function onMouseMove(e: MouseEvent) {
      const m = mouseRef.current;
      m.x = e.clientX;
      m.y = e.clientY;
      if (!m.set) {
        m.sx = m.x;
        m.sy = m.y;
        m.lx = m.x;
        m.ly = m.y;
        m.set = true;
      }
    }

    readColors();
    setSize();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", setSize);

    const themeObs = new MutationObserver(readColors);
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onVis = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", setSize);
      document.removeEventListener("visibilitychange", onVis);
      themeObs.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hidden md:block absolute top-0 left-0 z-[9] pointer-events-none"
      aria-hidden="true"
    />
  );
}
