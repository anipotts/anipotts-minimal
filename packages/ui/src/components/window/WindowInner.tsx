"use client";

import React from "react";
import { useWindowState } from "../../context/WindowContext";
import clsx from "clsx";

export interface WindowInnerProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
}

export function WindowInner({ children, showNavbar = true, showFooter = true }: WindowInnerProps) {
  const { isFullscreen } = useWindowState();

  return (
    <div className={clsx("px-6 md:px-12 lg:px-16 flex flex-col flex-grow overflow-y-auto overscroll-y-none min-h-0 bg-[rgba(var(--overlay-invert),0.4)] relative transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent", !isFullscreen && "min-h-[calc(100vh-8rem)]")}>
      
      <div className={clsx("w-full mx-auto transition-[max-width] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col flex-grow", isFullscreen ? "max-w-4xl" : "max-w-full")}>
        {/* Navbar as Command Row - conditionally rendered */}
        {showNavbar && (
          <div className={clsx("relative z-10 transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]", isFullscreen ? "translate-y-0" : "translate-y-0")}>
            {/* Navbar would be passed as a prop or imported from app-specific components */}
          </div>
        )}

        {/* Main Content Area - has view-transition-name for cross-document transitions */}
        <main className="main-content flex-grow w-full relative z-10 transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          {children}
        </main>

        {/* Footer as System Status - conditionally rendered */}
        {showFooter && (
          <div className={clsx("relative z-10 mt-auto pt-12 transition-all duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]", isFullscreen ? "translate-y-0" : "translate-y-0")}>
            {/* Footer would be passed as a prop or imported from app-specific components */}
          </div>
        )}
      </div>

      {/* Subtle Grid Overlay inside terminal body */}
      <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
    </div>
  );
}
