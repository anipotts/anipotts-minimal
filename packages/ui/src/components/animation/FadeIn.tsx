import React from "react";

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Animation direction: 'up' (default), 'down', 'left', 'right', or 'none' */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** @deprecated No longer used. Kept for API compatibility. */
  distance?: number;
}

const animationName: Record<NonNullable<FadeInProps["direction"]>, string> = {
  up: "fadeInUp",
  down: "fadeInDown",
  left: "fadeInLeft",
  right: "fadeInRight",
  none: "fadeInNone",
};

export function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up",
}: FadeInProps) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        animation: `${animationName[direction]} 0.6s ease-out both`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
