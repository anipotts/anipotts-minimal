"use client";

import { useState, useCallback, useRef } from "react";
import type { OutputLine } from "./types";
import { getMotd } from "./constants";

let lineId = 0;
function sysLine(content: string): OutputLine {
  return { id: `motd-${++lineId}`, type: "system", content };
}

function buildMotdLines(): OutputLine[] {
  return getMotd()
    .split("\n")
    .map((l) => sysLine(l));
}

export function useTerminalState() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const hasShownMotd = useRef(false);

  const open = useCallback(() => {
    if (!hasShownMotd.current) {
      setOutput(buildMotdLines());
      hasShownMotd.current = true;
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && !hasShownMotd.current) {
        setOutput(buildMotdLines());
        hasShownMotd.current = true;
      }
      return !prev;
    });
  }, []);

  const addOutput = useCallback((lines: OutputLine[]) => {
    setOutput((prev) => [...prev, ...lines]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const addInputLine = useCallback(
    (promptPrefix: string, value: string) => {
      const inputLine: OutputLine = {
        id: `input-${++lineId}`,
        type: "input",
        content: `${promptPrefix} ${value}`,
      };
      setOutput((prev) => [...prev, inputLine]);
    },
    []
  );

  return {
    isOpen,
    input,
    output,
    setInput,
    open,
    close,
    toggle,
    addOutput,
    clearOutput,
    addInputLine,
  };
}
