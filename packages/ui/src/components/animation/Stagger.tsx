import React from "react";

export interface StaggerProps {
  children: React.ReactNode;
  /** Seconds between each child's animation start (default: 0.06) */
  interval?: number;
  /** Initial delay before the first child animates (default: 0) */
  offset?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Wraps each child in a div with staggered fadeInUp animation.
 * Safe with server components, fragments, and components that don't forward style.
 * Nested Stagger compounds delays with its parent's injected animationDelay.
 */
export function Stagger({
  children,
  interval = 0.06,
  offset = 0,
  className,
  as: Tag = "div",
}: StaggerProps) {
  const items = React.Children.toArray(children);

  return (
    <Tag className={className}>
      {items.map((child, index) => (
        <div
          key={React.isValidElement(child) ? (child.key ?? index) : index}
          style={{
            opacity: 0,
            animation: "fadeInUp 0.5s ease-out both",
            animationDelay: `${offset + index * interval}s`,
          }}
        >
          {child}
        </div>
      ))}
    </Tag>
  );
}
