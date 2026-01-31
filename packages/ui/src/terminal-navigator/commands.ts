import { subdomains, SITE_VERSION } from "@anipotts/lib/data";
import type { CommandDef, CommandContext, OutputLine } from "./types";
import { PROMPT_USER, getPromptPath } from "./constants";

let lineId = 0;
function line(type: OutputLine["type"], content: string): OutputLine {
  return { id: `line-${++lineId}`, type, content };
}

function findSubdomain(name: string) {
  return subdomains.find((s) => s.name === name);
}

const helpCmd: CommandDef = {
  name: "help",
  description: "List all commands",
  execute: (_args, ctx) => {
    ctx.addOutput([
      line("system", "Available commands:"),
      line("output", ""),
      ...commands.map((cmd) =>
        line("output", `  ${cmd.name.padEnd(12)} ${cmd.description}`)
      ),
      line("output", ""),
      line("system", "Tab to autocomplete \u00b7 \u2191\u2193 for history \u00b7 Esc to close"),
    ]);
  },
};

const lsCmd: CommandDef = {
  name: "ls",
  description: "List subdomains",
  execute: (args, ctx) => {
    const long = args.includes("-la") || args.includes("-l") || args.includes("-al");
    if (long) {
      ctx.addOutput([
        line("output", "total 9"),
        ...subdomains.map((s) => {
          const current = s.name === ctx.currentSubdomain ? " *" : "";
          const nameType = s.name === ctx.currentSubdomain ? "accent" as const : "output" as const;
          return line(nameType,
            `${s.permissions}  1 ani  staff  4096  Jan 31 14:00  ${s.name}/${current}`
          );
        }),
      ]);
    } else {
      const names = subdomains.map((s) =>
        s.name === ctx.currentSubdomain ? `\x1b[accent]${s.name}/\x1b[/accent]*` : `${s.name}/`
      );
      // Show in a grid-like format
      ctx.addOutput([line("output", names.join("  "))]);
    }
  },
};

const cdCmd: CommandDef = {
  name: "cd",
  description: "Navigate to subdomain",
  execute: (args, ctx) => {
    const target = args[0];
    if (!target) {
      ctx.addOutput([line("error", "cd: missing argument")]);
      return;
    }
    const sub = findSubdomain(target);
    if (!sub) {
      ctx.addOutput([line("error", `cd: no such host: ${target}`)]);
      return;
    }
    if (sub.name === ctx.currentSubdomain) {
      ctx.addOutput([line("output", `Already on ${sub.name}`)]);
      return;
    }
    ctx.addOutput([line("success", `\u2192 navigating to ${sub.name}.anipotts.com...`)]);
    setTimeout(() => {
      window.location.href = sub.url;
    }, 300);
  },
};

const openCmd: CommandDef = {
  name: "open",
  description: "Open subdomain in new tab",
  execute: (args, ctx) => {
    const target = args[0];
    if (!target) {
      ctx.addOutput([line("error", "open: missing argument")]);
      return;
    }
    const sub = findSubdomain(target);
    if (!sub) {
      ctx.addOutput([line("error", `open: no such host: ${target}`)]);
      return;
    }
    ctx.addOutput([line("success", `Opening ${sub.url} in new tab...`)]);
    window.open(sub.url, "_blank", "noopener,noreferrer");
  },
};

const pwdCmd: CommandDef = {
  name: "pwd",
  description: "Print current subdomain path",
  execute: (_args, ctx) => {
    const sub = findSubdomain(ctx.currentSubdomain);
    ctx.addOutput([line("output", sub?.path ?? `/home/ani/${ctx.currentSubdomain}.anipotts.com`)]);
  },
};

const whoamiCmd: CommandDef = {
  name: "whoami",
  description: "Print user info",
  execute: (_args, ctx) => {
    ctx.addOutput([line("output", PROMPT_USER)]);
  },
};

const clearCmd: CommandDef = {
  name: "clear",
  description: "Clear terminal output",
  execute: (_args, ctx) => {
    ctx.clearOutput();
  },
};

const echoCmd: CommandDef = {
  name: "echo",
  description: "Echo text back",
  execute: (args, ctx) => {
    ctx.addOutput([line("output", args.join(" "))]);
  },
};

const ASCII_ART = [
  "        ___          _",
  "       /   \\  _ __  (_)",
  "      / /\\ \\| '_ \\ | |",
  "     / ____ \\ | | || |",
  "    /_/    \\_\\_| |_||_|",
  "     potts.com",
];

const neofetchCmd: CommandDef = {
  name: "neofetch",
  description: "System info card",
  execute: (_args, ctx) => {
    const uptime = Math.floor(performance.now() / 1000);
    const uptimeStr = uptime >= 60
      ? `${Math.floor(uptime / 60)}m ${uptime % 60}s`
      : `${uptime}s`;

    const info = [
      `${PROMPT_USER}`,
      "-".repeat(20),
      `OS: anipotts.com v${SITE_VERSION}`,
      `Host: ${ctx.currentSubdomain}.anipotts.com`,
      `Shell: zsh`,
      `Terminal: web`,
      `Packages: 9 (subdomains)`,
      `Uptime: ${uptimeStr}`,
      `Stack: Next.js \u00b7 React \u00b7 TypeScript`,
      `Theme: terminal-dark`,
    ];

    const maxArt = ASCII_ART.length;
    const maxInfo = info.length;
    const rows = Math.max(maxArt, maxInfo);

    const lines: OutputLine[] = [];
    for (let i = 0; i < rows; i++) {
      const art = i < maxArt ? ASCII_ART[i].padEnd(28) : " ".repeat(28);
      const inf = i < maxInfo ? info[i] : "";
      lines.push(line(i === 0 ? "accent" : "output", `${art}${inf}`));
    }
    ctx.addOutput(lines);
  },
};

const pingCmd: CommandDef = {
  name: "ping",
  description: "Ping a subdomain",
  execute: async (args, ctx) => {
    const target = args[0];
    if (!target) {
      ctx.addOutput([line("error", "ping: missing argument")]);
      return;
    }
    const sub = findSubdomain(target);
    if (!sub) {
      ctx.addOutput([line("error", `ping: unknown host ${target}`)]);
      return;
    }

    ctx.addOutput([line("output", `PING ${sub.name}.anipotts.com (${sub.url})...`)]);

    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const ms = (Math.random() * 20 + 5).toFixed(1);
      ctx.addOutput([
        line("success", `64 bytes from ${sub.name}: seq=${i} time=${ms}ms`),
      ]);
    }

    ctx.addOutput([line("output", `--- ${sub.name}.anipotts.com ping statistics ---`)]);
    ctx.addOutput([line("output", "3 packets transmitted, 3 received, 0% loss")]);
  },
};

const historyCmd: CommandDef = {
  name: "history",
  description: "Show command history",
  execute: (_args, ctx) => {
    if (ctx.commandHistory.length === 0) {
      ctx.addOutput([line("output", "No commands in history.")]);
      return;
    }
    ctx.addOutput(
      ctx.commandHistory.map((cmd, i) =>
        line("output", `  ${String(i + 1).padStart(4)}  ${cmd}`)
      )
    );
  },
};

const exitCmd: CommandDef = {
  name: "exit",
  description: "Close terminal",
  execute: (_args, ctx) => {
    ctx.closeTerminal();
  },
};

export const commands: CommandDef[] = [
  helpCmd,
  lsCmd,
  cdCmd,
  openCmd,
  pwdCmd,
  whoamiCmd,
  clearCmd,
  echoCmd,
  neofetchCmd,
  pingCmd,
  historyCmd,
  exitCmd,
];

export const commandNames = commands.map((c) => c.name);

export function executeCommand(input: string, ctx: CommandContext): void {
  const trimmed = input.trim();
  if (!trimmed) return;

  const parts = trimmed.split(/\s+/);
  const cmdName = parts[0].toLowerCase();
  const args = parts.slice(1);

  const cmd = commands.find((c) => c.name === cmdName);
  if (!cmd) {
    ctx.addOutput([
      { id: `line-${++lineId}`, type: "error", content: `command not found: ${cmdName}` },
    ]);
    return;
  }

  cmd.execute(args, ctx);
}
