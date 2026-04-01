"use client";

import { useEffect, useRef } from "react";

// ── Weakened ferrofluid params ──
const MAGNET_R = 80;
const MAGNET_STR = 12;
const BUBBLE_R = 22;
const SNAP_DEPTH = 90;
const BORDER_PTS = 240;
const MOUSE_LERP = 0.35;
const SPADE_SIZE = 28; // half-height of the spade shape

// ── Spade as discrete points for morphing animation ──
// When progress=0: points form a tiny circle (unraveled thread)
// When progress=1: points form the full spade shape
// In between: each point lerps with staggered timing (spaghetti pulling into shape)
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

function drawSpade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
) {
  const s = size / 18;
  const cos = Math.cos(angle - Math.PI / 2);
  const sin = Math.sin(angle - Math.PI / 2);
  const n = SPADE_PTS.length;

  ctx.beginPath();
  const worldPts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const [lx, ly] = SPADE_PTS[i]!;
    const px = lx * s,
      py = ly * s;
    worldPts.push({ x: x + px * cos - py * sin, y: y + px * sin + py * cos });
  }
  const first = worldPts[0]!,
    second = worldPts[1]!;
  ctx.moveTo((first.x + second.x) / 2, (first.y + second.y) / 2);
  for (let i = 1; i <= n; i++) {
    const curr = worldPts[i % n]!,
      next = worldPts[(i + 1) % n]!;
    ctx.quadraticCurveTo(
      curr.x,
      curr.y,
      (curr.x + next.x) / 2,
      (curr.y + next.y) / 2,
    );
  }
  ctx.closePath();
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
  const angleRef = useRef(0); // smoothed travel angle
  const frameRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);
  const winRectRef = useRef({ x: 0, y: 0, w: 0, h: 0, r: 8 });
  const cachedCardsRef = useRef<{ el: HTMLElement; rect: DOMRect }[]>([]);
  const cardScanFrameRef = useRef(0);
  const cardColorRef = useRef("#05070f");
  const bgColorRef = useRef("#020308");
  const gridColorRef = useRef("rgba(148, 163, 184, 0.07)");

  useEffect(() => {
    if (!canvasRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cvs = canvasRef.current!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = cvs.getContext("2d")!;

    function readColors() {
      const s = getComputedStyle(document.documentElement);
      cardColorRef.current = s.getPropertyValue("--card").trim();
      bgColorRef.current = s.getPropertyValue("--background").trim();
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

    function getRectPts() {
      const { x, y, w, h, r } = winRectRef.current;
      const pts: { bx: number; by: number }[] = [];
      const perim = 2 * (w + h - 4 * r) + 2 * Math.PI * r;
      const step = perim / BORDER_PTS;
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

    function drawFrame() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const m = mouseRef.current;
      const depth = m.set ? signedDepth() : -999;
      const borderPts = getRectPts();

      // ── Ferrofluid border deformation ──
      const insideFade = depth > 0 ? Math.max(0, 1 - depth / SNAP_DEPTH) : 1;
      const displaced = borderPts.map((pt) => {
        if (!m.set) return pt;
        const dx = m.sx - pt.bx,
          dy = m.sy - pt.by;
        const dist = Math.hypot(dx, dy);
        if (dist >= MAGNET_R || dist === 0) return pt;
        const t = 1 - dist / MAGNET_R;
        const ease = t * t * t * (t * (t * 6 - 15) + 10);
        const strength = ease * MAGNET_STR * insideFade;
        const angle = Math.atan2(dy, dx);
        return {
          bx: pt.bx + Math.cos(angle) * strength,
          by: pt.by + Math.sin(angle) * strength,
        };
      });

      // ── Fill window shape ──
      ctx.beginPath();
      const n = displaced.length;
      const f = displaced[0],
        s2 = displaced[1 % n];
      if (!f || !s2) return;
      ctx.moveTo((f.bx + s2.bx) / 2, (f.by + s2.by) / 2);
      for (let i = 1; i <= n; i++) {
        const c = displaced[i % n],
          nx = displaced[(i + 1) % n];
        if (c && nx)
          ctx.quadraticCurveTo(
            c.bx,
            c.by,
            (c.bx + nx.bx) / 2,
            (c.by + nx.by) / 2,
          );
      }
      ctx.closePath();
      ctx.fillStyle = cardColorRef.current;
      ctx.fill();

      // ── Grid lines ──
      const wr = winRectRef.current;
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = gridColorRef.current;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1;
      for (let gx = wr.x; gx <= wr.x + wr.w; gx += 24) {
        ctx.beginPath();
        ctx.moveTo(Math.round(gx) + 0.5, wr.y);
        ctx.lineTo(Math.round(gx) + 0.5, wr.y + wr.h);
        ctx.stroke();
      }
      for (let gy = wr.y; gy <= wr.y + wr.h; gy += 24) {
        ctx.beginPath();
        ctx.moveTo(wr.x, Math.round(gy) + 0.5);
        ctx.lineTo(wr.x + wr.w, Math.round(gy) + 0.5);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // ── Border stroke ──
      ctx.beginPath();
      const f2 = displaced[0],
        s3 = displaced[1 % n];
      if (f2 && s3) {
        ctx.moveTo((f2.bx + s3.bx) / 2, (f2.by + s3.by) / 2);
        for (let i = 1; i <= n; i++) {
          const c2 = displaced[i % n],
            nx2 = displaced[(i + 1) % n];
          if (c2 && nx2)
            ctx.quadraticCurveTo(
              c2.bx,
              c2.by,
              (c2.bx + nx2.bx) / 2,
              (c2.by + nx2.by) / 2,
            );
        }
        ctx.closePath();
      }
      ctx.strokeStyle = "rgba(97, 171, 234, 0.3)";
      ctx.stroke();

      // ── Cursor glow (subtle blue tint that follows cursor everywhere) ──
      if (m.set) {
        const glowR = 90;
        const grad = ctx.createRadialGradient(m.sx, m.sy, 0, m.sx, m.sy, glowR);
        grad.addColorStop(0, "rgba(97, 171, 234, 0.14)");
        grad.addColorStop(0.5, "rgba(97, 171, 234, 0.07)");
        grad.addColorStop(1, "rgba(97, 171, 234, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(m.sx - glowR, m.sy - glowR, glowR * 2, glowR * 2);
      }

      // ── Card ferrofluid borders ──
      const CARD_MAGNET_R = MAGNET_R;
      const CARD_BORDER_PTS = 80;

      // Rescan card elements every 60 frames (~1s at 60fps)
      cardScanFrameRef.current++;
      if (
        cardScanFrameRef.current >= 60 ||
        cachedCardsRef.current.length === 0
      ) {
        cardScanFrameRef.current = 0;
        const els = document.querySelectorAll<HTMLElement>(
          ".portal-content .rounded-md, .portal-content button, .portal-content a.rounded-sm, .portal-content input.rounded-sm",
        );
        cachedCardsRef.current = Array.from(els)
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width >= 30 && r.height >= 20;
          })
          .map((el) => ({ el, rect: el.getBoundingClientRect() }));
      }

      let nearestCardDist = Infinity;

      for (const card of cachedCardsRef.current) {
        const cr = card.el.getBoundingClientRect();
        if (cr.bottom < 0 || cr.top > window.innerHeight) continue;

        // Buttons/inputs get weaker ferrofluid
        const isButton =
          card.el.tagName === "BUTTON" ||
          card.el.tagName === "INPUT" ||
          cr.height < 50;
        const elMagnetR = isButton ? CARD_MAGNET_R * 0.5 : CARD_MAGNET_R;
        const elMagnetStr = isButton ? MAGNET_STR * 0.35 : MAGNET_STR;

        const dLeft = m.sx - cr.left;
        const dRight = cr.right - m.sx;
        const dTop = m.sy - cr.top;
        const dBottom = cr.bottom - m.sy;
        const inside = dLeft > 0 && dRight > 0 && dTop > 0 && dBottom > 0;
        const edgeDist = inside
          ? -Math.min(dLeft, dRight, dTop, dBottom)
          : Math.hypot(
              Math.max(cr.left - m.sx, 0, m.sx - cr.right),
              Math.max(cr.top - m.sy, 0, m.sy - cr.bottom),
            );
        if (edgeDist < nearestCardDist) nearestCardDist = edgeDist;

        // Generate card border points (sharper corners: radius 3)
        const cardR = 3;
        const cardPts: { bx: number; by: number }[] = [];
        const perim = 2 * (cr.width + cr.height);
        const step = perim / CARD_BORDER_PTS;

        for (let px = cr.left + cardR; px <= cr.right - cardR; px += step)
          cardPts.push({ bx: px, by: cr.top });
        for (let py = cr.top + cardR; py <= cr.bottom - cardR; py += step)
          cardPts.push({ bx: cr.right, by: py });
        for (let px = cr.right - cardR; px >= cr.left + cardR; px -= step)
          cardPts.push({ bx: px, by: cr.bottom });
        for (let py = cr.bottom - cardR; py >= cr.top + cardR; py -= step)
          cardPts.push({ bx: cr.left, by: py });

        // Magnetic deformation toward cursor (weaker for buttons)
        const displaced = cardPts.map((pt) => {
          const dx = m.sx - pt.bx,
            dy = m.sy - pt.by;
          const dist = Math.hypot(dx, dy);
          if (dist >= elMagnetR || dist === 0) return pt;
          const t = 1 - dist / elMagnetR;
          const ease = t * t * t * (t * (t * 6 - 15) + 10);
          const strength = ease * elMagnetStr;
          const angle = Math.atan2(dy, dx);
          return {
            bx: pt.bx + Math.cos(angle) * strength,
            by: pt.by + Math.sin(angle) * strength,
          };
        });

        // Hover proximity: 0 = far away, 1 = cursor on border/inside
        const hoverT =
          edgeDist < elMagnetR ? Math.pow(1 - edgeDist / elMagnetR, 2) : 0;

        // Draw card shape
        if (displaced.length > 2) {
          ctx.beginPath();
          const cn = displaced.length;
          const cf = displaced[0]!,
            cs = displaced[1 % cn]!;
          ctx.moveTo((cf.bx + cs.bx) / 2, (cf.by + cs.by) / 2);
          for (let i = 1; i <= cn; i++) {
            const cc = displaced[i % cn]!,
              cnx = displaced[(i + 1) % cn]!;
            ctx.quadraticCurveTo(
              cc.bx,
              cc.by,
              (cc.bx + cnx.bx) / 2,
              (cc.by + cnx.by) / 2,
            );
          }
          ctx.closePath();

          // On hover: cut out card fill to reveal waves bg
          if (hoverT > 0.05) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.globalAlpha = Math.min(1, hoverT * 1.5);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
          }

          // Border: idle = subtle blue, hover = bright blue
          const borderAlpha = 0.25 + hoverT * 0.75; // 0.25 idle → 1.0 on hover
          ctx.strokeStyle = `rgba(97, 171, 234, ${borderAlpha})`;
          ctx.stroke();
        }
      }

      // ── Nav item ferrofluid underlines ──
      const NAV_MAGNET_R = MAGNET_R * 0.5;
      const NAV_MAGNET_STR = MAGNET_STR * 0.35;
      const navEls = document.querySelectorAll<HTMLElement>("[data-ferro-nav]");
      for (const navEl of navEls) {
        const nr = navEl.getBoundingClientRect();
        if (nr.bottom < 0 || nr.top > window.innerHeight) continue;

        const isActive = navEl.hasAttribute("data-ferro-active");

        // Distance from cursor to nav element
        const nDLeft = m.sx - nr.left,
          nDRight = nr.right - m.sx;
        const nDTop = m.sy - nr.top,
          nDBottom = nr.bottom - m.sy;
        const nInside = nDLeft > 0 && nDRight > 0 && nDTop > 0 && nDBottom > 0;
        const navEdgeDist = nInside
          ? -Math.min(nDLeft, nDRight, nDTop, nDBottom)
          : Math.hypot(
              Math.max(nr.left - m.sx, 0, m.sx - nr.right),
              Math.max(nr.top - m.sy, 0, m.sy - nr.bottom),
            );

        if (navEdgeDist < nearestCardDist) nearestCardDist = navEdgeDist;

        // Only draw if active or cursor is nearby
        const navHoverT =
          navEdgeDist < NAV_MAGNET_R
            ? Math.pow(1 - navEdgeDist / NAV_MAGNET_R, 2)
            : 0;
        if (!isActive && navHoverT < 0.01) continue;

        // Generate bottom-edge-only points
        const bottomY = nr.bottom;
        const navPts: { bx: number; by: number }[] = [];
        const navStep = nr.width / 30;
        for (let px = nr.left; px <= nr.right; px += navStep) {
          navPts.push({ bx: px, by: bottomY });
        }
        navPts.push({ bx: nr.right, by: bottomY });

        // Magnetic deformation
        const navDisplaced = navPts.map((pt) => {
          const dx = m.sx - pt.bx,
            dy = m.sy - pt.by;
          const dist = Math.hypot(dx, dy);
          if (dist >= NAV_MAGNET_R || dist === 0) return pt;
          const t = 1 - dist / NAV_MAGNET_R;
          const ease = t * t * t * (t * (t * 6 - 15) + 10);
          const strength = ease * NAV_MAGNET_STR;
          const angle = Math.atan2(dy, dx);
          return {
            bx: pt.bx + Math.cos(angle) * strength,
            by: pt.by + Math.sin(angle) * strength,
          };
        });

        // Draw the underline
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

          const alpha = isActive ? 0.7 : navHoverT * 0.5;
          ctx.strokeStyle = `rgba(97, 171, 234, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // ── Spade cursor (only inside window) ──
      if (!m.set || depth < -5) return;
      const bubbleT = Math.max(0, Math.min(1, depth / 40));
      let spadeScale = bubbleT * SPADE_SIZE;
      if (spadeScale < 1) return;

      // ── Shrink spade near card borders ──
      const DISSOLVE_DIST = 30;
      if (nearestCardDist < DISSOLVE_DIST) {
        spadeScale *= Math.max(0, nearestCardDist / DISSOLVE_DIST);
      }
      if (spadeScale < 1) return;

      // Cut spade shape out of the fill
      ctx.globalCompositeOperation = "destination-out";
      drawSpade(ctx, m.sx, m.sy, angleRef.current, spadeScale);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Stroke spade with border color
      drawSpade(ctx, m.sx, m.sy, angleRef.current, spadeScale);
      ctx.strokeStyle = "rgba(97, 171, 234, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function tick() {
      if (!isVisibleRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      // Keep canvas viewport-aligned; absolute position means it rubber-bands with content
      cvs.style.transform = `translateY(${window.scrollY}px)`;
      measureWindow();

      const m = mouseRef.current;
      m.sx += (m.x - m.sx) * MOUSE_LERP;
      m.sy += (m.y - m.sy) * MOUSE_LERP;

      // ── Smooth travel angle ──
      const vx = m.sx - m.lx,
        vy = m.sy - m.ly;
      const speed = Math.hypot(vx, vy);
      if (speed > 0.5) {
        const targetAngle = Math.atan2(vy, vx);
        // Shortest-path angle interpolation
        let diff = targetAngle - angleRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        angleRef.current += diff * 0.2;
      }
      m.lx = m.sx;
      m.ly = m.sy;

      drawFrame();

      // ── Publish cursor state for Pretext/RevealBadge ──
      const depth = signedDepth();
      const bubbleT = Math.max(0, Math.min(1, depth / 40));
      const bubbleR = bubbleT * BUBBLE_R;
      // Spade scale computed in drawFrame, but we need it here too for CSS vars
      const rawSpadeScale = Math.max(0, Math.min(1, depth / 40)) * SPADE_SIZE;
      const root = document.documentElement;
      root.style.setProperty("--ferro-cx", `${m.sx}`);
      root.style.setProperty("--ferro-cy", `${m.sy}`);
      root.style.setProperty("--ferro-r", `${bubbleR}`);
      root.style.setProperty("--ferro-spade-r", `${rawSpadeScale}`);
      root.style.setProperty("--ferro-angle", `${angleRef.current}`);

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
