export type OutputLineType = "input" | "output" | "error" | "success" | "accent" | "system";

export interface OutputLine {
  id: string;
  type: OutputLineType;
  content: string;
}

export interface TerminalState {
  isOpen: boolean;
  input: string;
  output: OutputLine[];
  historyIndex: number;
}

export interface CommandContext {
  currentSubdomain: string;
  addOutput: (lines: OutputLine[]) => void;
  clearOutput: () => void;
  closeTerminal: () => void;
  commandHistory: string[];
  /**
   * SPA navigation function. When provided, cd uses this instead of
   * window.location.href. Called with (subdomain).
   */
  navigate?: (subdomain: string) => void;
}

export interface CommandDef {
  name: string;
  description: string;
  execute: (args: string[], ctx: CommandContext) => void | Promise<void>;
}

export interface TerminalNavigatorProps {
  currentSubdomain: string;
  onNavigate?: (subdomain: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}
