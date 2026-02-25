"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TerminalNavigatorProps, OutputLine, CommandContext } from "./types";
import { PROMPT_USER, getPromptPath, ANIMATION_CONFIG, TERMINAL_HEIGHT } from "./constants";
import { executeCommand } from "./commands";
import { useTerminalState } from "./useTerminalState";
import { useTerminalHistory } from "./useTerminalHistory";
import { useTabCompletion } from "./useTabCompletion";
import { TerminalOutput } from "./TerminalOutput";
import { TerminalInput } from "./TerminalInput";
import { useLayoutCoordinator } from "../context/LayoutCoordinator";

export function TerminalNavigator({
  currentSubdomain,
  onNavigate,
  onOpen,
  onClose,
}: TerminalNavigatorProps) {
  const state = useTerminalState();
  const cmdHistory = useTerminalHistory();
  const { complete } = useTabCompletion();
  const [ghostText, setGhostText] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Layout coordination for split-view with admin panel
  const layout = useLayoutCoordinator();
  const isAdminOpen = layout.state.isAdminOpen;

  // Compute terminal height: 50vh when admin is open, 45vh otherwise
  const terminalHeight = isAdminOpen ? "50vh" : TERMINAL_HEIGHT;

  // Sync terminal open state with layout coordinator
  useEffect(() => {
    if (state.isOpen) {
      layout.openTerminal();
    } else {
      layout.closeTerminal();
    }
  }, [state.isOpen, layout.openTerminal, layout.closeTerminal]);

  // Ctrl+` listener (desktop only)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    if (!mq.matches) return;

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        state.toggle();
      }
    };

    // Recheck media query on resize
    const checkMq = () => {
      if (!mq.matches && state.isOpen) {
        state.close();
      }
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("resize", checkMq);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("resize", checkMq);
    };
  }, [state]);

  // Lock body scroll when terminal is open
  useEffect(() => {
    if (state.isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [state.isOpen]);

  // Fire callbacks
  useEffect(() => {
    if (state.isOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [state.isOpen, onOpen, onClose]);

  // Escape + click outside
  useEffect(() => {
    if (!state.isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        state.close();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        state.close();
      }
    };

    window.addEventListener("keydown", handleEsc);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [state]);

  const promptPrefix = `${PROMPT_USER}:${getPromptPath(currentSubdomain)} $`;

  const handleSubmit = useCallback(() => {
    const val = state.input.trim();
    state.addInputLine(promptPrefix, state.input);
    state.setInput("");
    setGhostText("");
    cmdHistory.resetIndex();

    if (!val) return;
    cmdHistory.push(val);

    const ctx: CommandContext = {
      currentSubdomain,
      addOutput: (lines: OutputLine[]) => state.addOutput(lines),
      clearOutput: () => state.clearOutput(),
      closeTerminal: () => state.close(),
      commandHistory: cmdHistory.history,
      // SPA navigation function - commands use this instead of window.location
      navigate: onNavigate,
    };

    executeCommand(val, ctx);
  }, [state, currentSubdomain, cmdHistory, promptPrefix, onNavigate]);

  const handleArrowUp = useCallback(() => {
    const prev = cmdHistory.navigateUp(state.input);
    state.setInput(prev);
  }, [cmdHistory, state]);

  const handleArrowDown = useCallback(() => {
    const next = cmdHistory.navigateDown();
    state.setInput(next);
  }, [cmdHistory, state]);

  const handleTab = useCallback(() => {
    const { completed, options } = complete(state.input);
    if (completed !== state.input) {
      state.setInput(completed);
      setGhostText("");
    } else if (options.length > 1) {
      // Show options as output
      let lineIdCounter = 0;
      state.addOutput(
        options.map((o) => ({
          id: `tab-${++lineIdCounter}-${Date.now()}`,
          type: "output" as const,
          content: `  ${o}`,
        }))
      );
    }
  }, [complete, state]);

  // Update ghost text on input change
  useEffect(() => {
    if (state.input) {
      const { completed } = complete(state.input);
      const trimmedCompleted = completed.trimEnd();
      if (trimmedCompleted !== state.input && trimmedCompleted.startsWith(state.input)) {
        setGhostText(trimmedCompleted);
      } else {
        setGhostText("");
      }
    } else {
      setGhostText("");
    }
  }, [state.input, complete]);

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998] bg-[var(--background)]"
          />

          {/* Terminal panel */}
          <motion.div
            ref={panelRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: ANIMATION_CONFIG.stiffness,
              damping: ANIMATION_CONFIG.damping,
              mass: ANIMATION_CONFIG.mass,
            }}
            className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col overflow-hidden border-t border-[var(--border)] shadow-2xl"
            style={{ height: terminalHeight }}
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--input-bg)] shrink-0">
              <div className="flex items-center gap-2">
                {/* Decorative traffic dots */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono ml-2">
                  {PROMPT_USER} — zsh — 80×24
                </span>
              </div>
              <button
                onClick={() => state.close()}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-xs font-mono"
                aria-label="Close terminal"
              >
                [x]
              </button>
            </div>

            {/* Output area */}
            <div className="flex-1 overflow-hidden bg-[var(--card)]" style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)" }}>
              <TerminalOutput lines={state.output} />
            </div>

            {/* Input line */}
            <TerminalInput
              subdomain={currentSubdomain}
              value={state.input}
              onChange={state.setInput}
              onSubmit={handleSubmit}
              onArrowUp={handleArrowUp}
              onArrowDown={handleArrowDown}
              onTab={handleTab}
              ghostText={ghostText}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
