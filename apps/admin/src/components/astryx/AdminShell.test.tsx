import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { navItems } from "../../data/admin";
import { AdminShell } from "./AdminShell";

describe("AdminShell mobile navigation", () => {
  it("connects the native disclosure to its navigation sheet", () => {
    const markup = renderToStaticMarkup(
      <AdminShell
        chrome="admin"
        currentRoute="/work?view=now"
        navItems={navItems}
        title="work"
      >
        <div>work</div>
      </AdminShell>,
    );

    expect(markup).toContain('aria-label="toggle navigation"');
    expect(markup).toContain('aria-controls="admin-mobile-menu-panel"');
    expect(markup).toContain('id="admin-mobile-menu-panel"');
  });

  it("keeps the tablet sheet opaque and scroll-contained", () => {
    const css = readFileSync(
      new URL("../../styles/admin.css", import.meta.url),
      "utf8",
    );
    const sheetRule = css.match(/\.admin-mobile-menu nav \{(?<rule>[^}]*)\}/s)
      ?.groups?.rule;

    expect(sheetRule).toContain("overscroll-behavior: contain");
    expect(sheetRule).toContain("background: var(--color-background-body)");
    expect(sheetRule).toContain("color: var(--color-text-primary)");
    expect(sheetRule).not.toContain("var(--color-background)");
  });
});
