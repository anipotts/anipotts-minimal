"use client";

import { useEffect, useMemo, useState } from "react";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { usePostHog } from "posthog-js/react";

type FormStatus = "idle" | "loading" | "success" | "error";

const INTENT_OPTIONS = [
  "hire",
  "collab",
  "claude consulting",
  "product feedback",
] as const;

interface ContactFormProps {
  initialIntent?: string;
}

export default function ContactForm({ initialIntent = "" }: ContactFormProps) {
  const posthog = usePostHog();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const isLocalPreview =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  const captchaRequired =
    Boolean(turnstileSiteKey) && !isLocalPreview;

  const [intent, setIntent] = useState<(typeof INTENT_OPTIONS)[number] | "">("");
  const [brief, setBrief] = useState("");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expanded, setExpanded] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initialIntent) return;
    const matchedIntent = INTENT_OPTIONS.find((option) =>
      option.replace(/\s+/g, "-") === initialIntent || option === initialIntent,
    );
    if (matchedIntent) {
      setIntent(matchedIntent);
    }
  }, [initialIntent]);

  const wordCount = useMemo(() => brief.trim().split(/\s+/).filter(Boolean).length, [brief]);
  const qualityHint = useMemo(() => {
    if (!brief.trim()) return "Start with your objective and timeline.";
    if (wordCount < 8) return "Add scope and urgency for a faster response.";
    if (wordCount < 16) return "Good. Add expected outcome for best triage.";
    return "Strong brief. Ready to send.";
  }, [brief, wordCount]);

  const canExpand = Boolean(intent) && brief.trim().length >= 20;
  const canSubmit = expanded && name.trim().length > 1 && email.trim().length > 3;

  const statusStyles: Record<FormStatus, string> = {
    idle: "bg-accent-400/10 text-accent-400 border border-accent-400/20 hover:bg-accent-400/20",
    loading: "bg-accent-400/10 text-accent-400 border border-accent-400/20",
    success: "bg-green-500/10 text-green-400 border border-green-500/20",
    error: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
  };

  const resetTurnstile = () => {
    if (!turnstileSiteKey) return;
    const win = window as unknown as { turnstile?: { reset?: () => void } };
    win.turnstile?.reset?.();
    setCaptchaToken("");
  };

  useEffect(() => {
    if (!turnstileSiteKey) return;

    const win = window as unknown as {
      turnstile?: { reset?: () => void };
      turnstileCallback?: (token: string) => void;
      turnstileExpiredCallback?: () => void;
    };

    win.turnstileCallback = (token: string) => {
      setCaptchaToken(token);
    };

    win.turnstileExpiredCallback = () => {
      setCaptchaToken("");
    };

    const cleanup = () => {
      win.turnstileCallback = undefined;
      win.turnstileExpiredCallback = undefined;
    };

    const existing = document.querySelector("script[data-turnstile]");
    if (existing) {
      setCaptchaReady(true);
      return cleanup;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-turnstile", "true");
    script.onload = () => setCaptchaReady(true);
    script.onerror = () => setCaptchaReady(false);
    document.body.appendChild(script);

    return cleanup;
  }, [turnstileSiteKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!intent) {
      setStatus("error");
      setErrorMessage("Select an intent first.");
      return;
    }

    if (!expanded) {
      if (canExpand) {
        setExpanded(true);
        posthog.capture("contact_composer_expanded", {
          intent,
          brief_words: wordCount,
        });
      }
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      if (captchaRequired && !captchaToken) {
        setStatus("error");
        setErrorMessage("Please complete the captcha.");
        return;
      }

      const message = `[intent:${intent}]\n${brief.trim()}${details.trim() ? `\n\n${details.trim()}` : ""}`;

      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message,
          captchaToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Send failed");
      }

      posthog.capture("contact_composer_submitted", {
        intent,
        brief_words: wordCount,
      });

      setStatus("success");
      setBrief("");
      setDetails("");
      setName("");
      setEmail("");
      setIntent("");
      setExpanded(false);
      resetTurnstile();

      setTimeout(() => setStatus("idle"), 2800);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Failed to send. Try again or email me directly.");
      resetTurnstile();
      posthog.capture("contact_composer_error", {
        intent,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full" aria-live="polite">
      <div className="border border-border-subtle rounded-md bg-[rgba(var(--overlay-invert),0.45)] p-4 md:p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.16em] text-accent-400">intent</p>
          <div className="flex flex-wrap gap-2">
            {INTENT_OPTIONS.map((option) => {
              const active = intent === option;
              return (
                <button
                  key={option}
                  type="button"
                  className={`min-h-11 px-3 py-2 text-xs uppercase tracking-wider rounded-sm border transition-colors ${
                    active
                      ? "border-accent-400 bg-accent-400/15 text-accent-400"
                      : "border-border text-muted hover:text-secondary hover:border-overlay-30"
                  }`}
                  onClick={() => {
                    setIntent(option);
                    posthog.capture("contact_intent_selected", { intent: option });
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="brief" className="text-xs uppercase tracking-[0.16em] text-accent-400">
            what are you trying to build?
          </label>
          <textarea
            id="brief"
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            placeholder="One clear objective, constraints, and timeline"
            className="min-h-28 bg-input border border-border rounded-sm p-3 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono resize-y"
            maxLength={900}
            required
          />
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted">{qualityHint}</span>
            <span className="text-faint">{brief.length}/900</span>
          </div>
        </div>

        {!expanded && (
          <button
            type="button"
            onClick={() => {
              if (canExpand) {
                setExpanded(true);
                posthog.capture("contact_composer_expanded", {
                  intent,
                  brief_words: wordCount,
                });
              }
            }}
            disabled={!canExpand}
            className={`min-h-11 px-4 py-2 rounded-sm text-xs uppercase tracking-[0.16em] transition-colors border ${
              canExpand
                ? "border-accent-400/30 text-accent-400 hover:bg-accent-400/10"
                : "border-border text-faint cursor-not-allowed"
            }`}
          >
            continue
          </button>
        )}

        {expanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-xs uppercase tracking-[0.16em] text-accent-400">
                your name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="min-h-11 bg-input border border-border rounded-sm p-2.5 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs uppercase tracking-[0.16em] text-accent-400">
                your email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="min-h-11 bg-input border border-border rounded-sm p-2.5 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono"
                required
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label htmlFor="details" className="text-xs uppercase tracking-[0.16em] text-accent-400">
                extra context (optional)
              </label>
              <textarea
                id="details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Links, references, constraints, hiring context"
                className="min-h-24 bg-input border border-border rounded-sm p-3 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono resize-y"
                maxLength={1200}
              />
            </div>
          </div>
        )}

        {turnstileSiteKey && expanded && (
          <div className="mt-1">
            <div
              className="cf-turnstile"
              data-sitekey={turnstileSiteKey}
              data-callback="turnstileCallback"
              data-expired-callback="turnstileExpiredCallback"
              aria-label="CAPTCHA verification"
            />
            {!captchaReady && <p className="text-faint text-xs mt-2">Loading captcha...</p>}
          </div>
        )}
      </div>

      {expanded && (
        <button
          type="submit"
          disabled={
            status === "loading" ||
            status === "success" ||
            !canSubmit ||
            (captchaRequired ? !captchaToken : false)
          }
          className={`min-h-11 mt-1 flex items-center justify-center gap-2 py-2 px-4 rounded-sm text-xs uppercase tracking-[0.16em] font-bold transition-all duration-200 ${statusStyles[status]}`}
        >
          {status === "loading" ? (
            <>
              <SpinnerGap className="animate-spin" size={14} /> sending
            </>
          ) : status === "success" ? (
            "message sent"
          ) : status === "error" ? (
            "failed - retry"
          ) : (
            <>
              dispatch message <PaperPlaneTilt size={12} />
            </>
          )}
        </button>
      )}

      {status === "success" && (
        <p className="text-green-400 text-xs mt-1 uppercase tracking-wider">
          message sent
        </p>
      )}

      {errorMessage && <p className="text-red-400 text-xs mt-1">{errorMessage}</p>}
    </form>
  );
}
