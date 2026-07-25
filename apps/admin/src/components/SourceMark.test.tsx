import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SourceMark } from "./SourceMark";

describe("SourceMark", () => {
  it.each(["codex", "chatgpt", "claude"] as const)(
    "renders the official %s mark with an accessible source label",
    (provider) => {
      const markup = renderToStaticMarkup(<SourceMark provider={provider} />);

      expect(markup).toContain("<img");
      expect(markup).toContain(`data-provider="${provider}"`);
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toMatch(/aria-label="(?:Codex|ChatGPT|Claude) source"/);
    },
  );

  it("retains a compact text fallback for sources without a localized mark", () => {
    const markup = renderToStaticMarkup(<SourceMark provider="github" />);

    expect(markup).not.toContain("<img");
    expect(markup).toContain(">GH<");
    expect(markup).toContain('aria-label="GitHub source"');
  });
});
