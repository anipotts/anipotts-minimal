"use client";

import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";

function FerrofluidInput({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animId = 0;

    function draw() {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;

      const rect = container!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const points = 120;
      const magnetRadius = 60;
      const magnetStrength = 8;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const t = i / points;
        let x: number, y: number;

        const perimeter = 2 * (rect.width + rect.height);
        const d = t * perimeter;

        if (d < rect.width) {
          x = d;
          y = 0;
        } else if (d < rect.width + rect.height) {
          x = rect.width;
          y = d - rect.width;
        } else if (d < 2 * rect.width + rect.height) {
          x = rect.width - (d - rect.width - rect.height);
          y = rect.height;
        } else {
          x = 0;
          y = rect.height - (d - 2 * rect.width - rect.height);
        }

        const dx = mx - x;
        const dy = my - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < magnetRadius && dist > 0) {
          const force = (1 - dist / magnetRadius) * magnetStrength;
          x += (dx / dist) * force;
          y += (dy / dist) * force;
        }

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.strokeStyle = "rgba(97, 171, 234, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (mx > 0 && my > 0) {
        const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 50);
        glow.addColorStop(0, "rgba(97, 171, 234, 0.12)");
        glow.addColorStop(1, "rgba(97, 171, 234, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      animId = requestAnimationFrame(draw);
    }

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onLeave = () => {
      mouseRef.current = { x: -100, y: -100 };
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    animId = requestAnimationFrame(draw);

    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      {children}
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await login(formData);
      if ("success" in result && result.success) {
        router.refresh();
        return null;
      }
      return result as { error?: string };
    },
    null,
  );

  return (
    <form action={formAction} className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
          admin
        </h2>
        <p className="text-xs text-zinc-600 font-mono">anipotts.com</p>
      </div>

      {state?.error && (
        <p className="text-red-400 text-sm text-center">{state.error}</p>
      )}

      <FerrofluidInput>
        <input
          name="password"
          type="password"
          placeholder="password"
          aria-label="Password"
          required
          autoFocus
          className="w-full px-5 py-4 bg-zinc-900/50 border border-transparent rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none text-lg tracking-wider relative z-10"
        />
      </FerrofluidInput>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg font-medium text-zinc-300 transition-colors text-sm tracking-wide"
      >
        {isPending ? "..." : "enter"}
      </button>
    </form>
  );
}
