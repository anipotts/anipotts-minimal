"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export default function Teleprompter({
  hook,
  body,
  outro,
}: {
  hook: string;
  body: string[];
  outro: string;
}) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState(30); // pixels per second
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleScroll = useCallback(() => {
    setIsScrolling((prev) => !prev);
  }, []);

  const adjustSpeed = useCallback((delta: number) => {
    setSpeed((prev) => Math.max(10, Math.min(100, prev + delta)));
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        toggleScroll();
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        adjustSpeed(5);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        adjustSpeed(-5);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [toggleScroll, adjustSpeed]);

  useEffect(() => {
    if (!isScrolling || !containerRef.current) return;

    let animationId: number;
    let lastTime = performance.now();

    function scroll(time: number) {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      if (containerRef.current) {
        containerRef.current.scrollTop += speed * delta;
      }
      animationId = requestAnimationFrame(scroll);
    }

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isScrolling, speed]);

  return (
    <>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="border-l-4 border-red-500 pl-4 py-2">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
            Hook
          </p>
          <p className="text-2xl md:text-3xl font-bold leading-relaxed text-red-100">
            {hook}
          </p>
        </div>

        <div className="space-y-6 py-4">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Body
          </p>
          {body.map((point, i) => (
            <p
              key={i}
              className="text-2xl md:text-3xl leading-relaxed text-zinc-100"
            >
              {point}
            </p>
          ))}
          {body.length === 0 && (
            <p className="text-xl text-zinc-600 italic">
              No body points extracted
            </p>
          )}
        </div>

        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
            Outro / CTA
          </p>
          <p className="text-2xl md:text-3xl font-bold leading-relaxed text-blue-100">
            {outro}
          </p>
        </div>

        {/* Extra space for scrolling */}
        <div className="h-[50vh]" />
      </div>

      <div className="sticky bottom-0 bg-zinc-900/90 backdrop-blur border-t border-zinc-800 p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <span className="text-xs text-zinc-500">Speed: {speed}px/s</span>

          <button
            onClick={toggleScroll}
            className={`px-6 py-3 rounded-xl font-semibold text-lg transition-colors ${
              isScrolling
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-green-600 hover:bg-green-500 text-white"
            }`}
          >
            {isScrolling ? "Pause" : "Start"}
          </button>

          <span className="text-xs text-zinc-600">Space / Arrows</span>
        </div>
      </div>
    </>
  );
}
