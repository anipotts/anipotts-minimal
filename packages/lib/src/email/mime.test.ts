import { describe, expect, it } from "vitest";
import { buildMime, parseAddress } from "./mime";

describe("parseAddress", () => {
  it("parses display-name + addr", () => {
    expect(parseAddress("Ani <ani@anipotts.com>")).toEqual({
      name: "Ani",
      addr: "ani@anipotts.com",
    });
  });

  it("parses quoted display-name", () => {
    expect(parseAddress('"Ani Potts" <ani@anipotts.com>')).toEqual({
      name: "Ani Potts",
      addr: "ani@anipotts.com",
    });
  });

  it("parses bare addr", () => {
    expect(parseAddress("ani@anipotts.com")).toEqual({
      addr: "ani@anipotts.com",
    });
  });
});

describe("buildMime", () => {
  it("includes From, To, Subject, Reply-To", () => {
    const raw = buildMime({
      from: "Contact Form <noreply@anipotts.com>",
      to: "contact@anipotts.com",
      replyTo: "user@example.com",
      subject: "Hello",
      text: "body text",
    });
    expect(raw).toMatch(/^From:.*noreply@anipotts\.com/m);
    expect(raw).toMatch(/^To:.*contact@anipotts\.com/m);
    expect(raw).toMatch(/^Subject:.*SGVsbG8=/m); // "Hello" base64
    expect(raw).toMatch(/^Reply-To:.*user@example\.com/m);
    expect(raw).toContain("body text");
  });

  it("renders html-only", () => {
    const raw = buildMime({
      from: "noreply@anipotts.com",
      to: "hello@anipotts.com",
      subject: "Weekly",
      html: "<p>hi</p>",
    });
    expect(raw).toMatch(/Content-Type:\s*text\/html/i);
    expect(raw).toContain("<p>hi</p>");
  });

  it("renders multipart when both text and html provided", () => {
    const raw = buildMime({
      from: "noreply@anipotts.com",
      to: "hello@anipotts.com",
      subject: "Mixed",
      text: "plain",
      html: "<p>rich</p>",
    });
    expect(raw).toMatch(/multipart\//i);
    expect(raw).toContain("plain");
    expect(raw).toContain("<p>rich</p>");
  });
});
