"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

/**
 * Layout panel states and computed dimensions for admin + terminal coordination.
 * When both panels are open, they split the viewport 50/50.
 */

export interface LayoutState {
  isAdminOpen: boolean;
  isTerminalOpen: boolean;
}

export interface LayoutDimensions {
  adminHeight: string;
  terminalHeight: string;
  adminTop: string;
  terminalTop: string;
}

export interface LayoutCoordinatorContextType {
  state: LayoutState;
  dimensions: LayoutDimensions;
  openAdmin: () => void;
  closeAdmin: () => void;
  toggleAdmin: () => void;
  openTerminal: () => void;
  closeTerminal: () => void;
  toggleTerminal: () => void;
}

const LayoutCoordinatorContext = createContext<LayoutCoordinatorContextType | undefined>(undefined);

/**
 * Calculate layout dimensions based on which panels are open.
 * - Both open: 50/50 split (admin top, terminal bottom)
 * - Admin only: full viewport
 * - Terminal only: 45vh from bottom (existing behavior)
 */
function computeDimensions(state: LayoutState): LayoutDimensions {
  const { isAdminOpen, isTerminalOpen } = state;

  if (isAdminOpen && isTerminalOpen) {
    // Split view: admin top 50%, terminal bottom 50%
    return {
      adminHeight: "50vh",
      terminalHeight: "50vh",
      adminTop: "0",
      terminalTop: "50vh",
    };
  }

  if (isAdminOpen) {
    // Admin only: full screen
    return {
      adminHeight: "100vh",
      terminalHeight: "0",
      adminTop: "0",
      terminalTop: "100vh",
    };
  }

  if (isTerminalOpen) {
    // Terminal only: 45vh from bottom (existing behavior)
    return {
      adminHeight: "0",
      terminalHeight: "45vh",
      adminTop: "-100vh",
      terminalTop: "55vh",
    };
  }

  // Nothing open
  return {
    adminHeight: "0",
    terminalHeight: "0",
    adminTop: "-100vh",
    terminalTop: "100vh",
  };
}

interface LayoutCoordinatorProviderProps {
  children: ReactNode;
}

export function LayoutCoordinatorProvider({ children }: LayoutCoordinatorProviderProps) {
  const [state, setState] = useState<LayoutState>({
    isAdminOpen: false,
    isTerminalOpen: false,
  });

  const openAdmin = useCallback(() => {
    setState((prev) => prev.isAdminOpen ? prev : { ...prev, isAdminOpen: true });
  }, []);

  const closeAdmin = useCallback(() => {
    setState((prev) => !prev.isAdminOpen ? prev : { ...prev, isAdminOpen: false });
  }, []);

  const toggleAdmin = useCallback(() => {
    setState((prev) => ({ ...prev, isAdminOpen: !prev.isAdminOpen }));
  }, []);

  const openTerminal = useCallback(() => {
    setState((prev) => prev.isTerminalOpen ? prev : { ...prev, isTerminalOpen: true });
  }, []);

  const closeTerminal = useCallback(() => {
    setState((prev) => !prev.isTerminalOpen ? prev : { ...prev, isTerminalOpen: false });
  }, []);

  const toggleTerminal = useCallback(() => {
    setState((prev) => ({ ...prev, isTerminalOpen: !prev.isTerminalOpen }));
  }, []);

  const dimensions = useMemo(() => computeDimensions(state), [state]);

  const value = useMemo(
    () => ({
      state,
      dimensions,
      openAdmin,
      closeAdmin,
      toggleAdmin,
      openTerminal,
      closeTerminal,
      toggleTerminal,
    }),
    [state, dimensions, openAdmin, closeAdmin, toggleAdmin, openTerminal, closeTerminal, toggleTerminal]
  );

  return (
    <LayoutCoordinatorContext.Provider value={value}>
      {children}
    </LayoutCoordinatorContext.Provider>
  );
}

/**
 * Default dimensions when no panels are open (or no provider is present).
 */
const DEFAULT_DIMENSIONS: LayoutDimensions = {
  adminHeight: "100vh",
  terminalHeight: "0",
  adminTop: "0",
  terminalTop: "100vh",
};

/**
 * Default state when no provider is present.
 */
const DEFAULT_STATE: LayoutState = {
  isAdminOpen: false,
  isTerminalOpen: false,
};

export function useLayoutCoordinator() {
  const context = useContext(LayoutCoordinatorContext);
  // Return a default/noop context if not within provider (for SSG safety)
  if (context === undefined) {
    return {
      state: DEFAULT_STATE,
      dimensions: DEFAULT_DIMENSIONS,
      openAdmin: () => {},
      closeAdmin: () => {},
      toggleAdmin: () => {},
      openTerminal: () => {},
      closeTerminal: () => {},
      toggleTerminal: () => {},
    } satisfies LayoutCoordinatorContextType;
  }
  return context;
}

/**
 * Hook for components that only need to know if panels are open (read-only).
 * Useful for components that need to adjust their own layout but don't control panels.
 */
export function useLayoutState() {
  const { state, dimensions } = useLayoutCoordinator();
  return { ...state, ...dimensions };
}
