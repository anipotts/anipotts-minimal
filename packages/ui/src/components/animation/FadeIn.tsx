import React from "react";

export interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <div
      className={className}
      style={{
        opacity: 0,
        animation: `fadeInUp 0.5s ease-out both`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
