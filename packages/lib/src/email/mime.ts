import { createMimeMessage, Mailbox } from "mimetext";
import type { OutboundEmail } from "./types";

const ADDR_RE = /^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/;

export function parseAddress(addr: string): { name?: string; addr: string } {
  const match = ADDR_RE.exec(addr);
  if (!match) return { addr: addr.trim() };
  const inner = (match[2] ?? "").trim();
  const name = match[1]?.trim();
  return name ? { name, addr: inner } : { addr: inner };
}

export function buildMime(msg: OutboundEmail): string {
  const m = createMimeMessage();
  m.setSender(parseAddress(msg.from));
  m.setRecipient(msg.to);
  m.setSubject(msg.subject);
  if (msg.replyTo) m.setHeader("Reply-To", new Mailbox(msg.replyTo));

  if (msg.html && msg.text) {
    m.addMessage({ contentType: "text/plain", data: msg.text });
    m.addMessage({ contentType: "text/html", data: msg.html });
  } else if (msg.html) {
    m.addMessage({ contentType: "text/html", data: msg.html });
  } else {
    m.addMessage({ contentType: "text/plain", data: msg.text ?? "" });
  }

  return m.asRaw();
}
