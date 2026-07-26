import React from "react";
import chatgptMark from "../assets/provider-marks/chatgpt.png";
import claudeMark from "../assets/provider-marks/claude.svg";
import codexMark from "../assets/provider-marks/codex.svg";

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
  github: "GH",
  handoff: "HO",
  codex: "",
  claude: "",
  chatgpt: "",
};

const assetUrl = (asset: string | ImageMetadata) =>
  typeof asset === "string" ? asset : asset.src;

const providerMarks: Partial<Record<Props["provider"], string>> = {
  codex: assetUrl(codexMark),
  claude: assetUrl(claudeMark),
  chatgpt: assetUrl(chatgptMark),
};

export function SourceMark({ provider, compact = false }: Props) {
  const label = providerLabels[provider];

  return (
    <span
      className={`operator-source-mark${compact ? " is-compact" : ""}`}
      data-provider={provider}
      aria-label={`${label} source`}
      title={`${label} source`}
    >
      {providerMarks[provider] ? (
        <img
          className="operator-source-logo"
          src={providerMarks[provider]}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <span className="operator-source-glyph" aria-hidden="true">
          {providerGlyphs[provider]}
        </span>
      )}
      {!compact && (
        <>
          <span className="operator-source-label">{label}</span>
          <span className="sr-only"> provider</span>
        </>
      )}
    </span>
  );
}
