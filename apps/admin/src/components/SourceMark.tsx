type Props = {
  provider: "codex" | "claude" | "github" | "handoff" | "chatgpt";
  compact?: boolean;
};

const providerLabels: Record<Props["provider"], string> = {
  codex: "Codex",
  claude: "Claude",
  github: "GitHub",
  handoff: "handoff",
  chatgpt: "ChatGPT",
};

const providerGlyphs: Record<Props["provider"], string> = {
  codex: "CX",
  claude: "CL",
  github: "GH",
  handoff: "HO",
  chatgpt: "GPT",
};

export function SourceMark({ provider, compact = false }: Props) {
  const label = providerLabels[provider];

  return (
    <span
      className="operator-source-mark"
      data-provider={provider}
      aria-label={`${label} source`}
      title={`${label} source`}
    >
      <span className="operator-source-glyph" aria-hidden="true">
        {providerGlyphs[provider]}
      </span>
      <span className="operator-source-label">{label}</span>
      {!compact && <span className="sr-only"> provider</span>}
    </span>
  );
}
