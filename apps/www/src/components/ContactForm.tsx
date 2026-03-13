"use client";

import { useEffect, useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { usePostHog } from "posthog-js/react";
import { contactSchema } from "@anipotts/lib";

type FormStatus = "idle" | "loading" | "success" | "error";

const INTENT_OPTIONS = [
  "hire",
  "collab",
  "claude consulting",
  "other",
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
  const captchaRequired = Boolean(turnstileSiteKey) && !isLocalPreview;

  const [intent, setIntent] = useState<(typeof INTENT_OPTIONS)[number] | "">(
    "",
  );
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [_fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialIntent) return;
    const matchedIntent = INTENT_OPTIONS.find(
      (option) =>
        option.replace(/\s+/g, "-") === initialIntent ||
        option === initialIntent,
    );
    if (matchedIntent) {
      setIntent(matchedIntent);
    }
  }, [initialIntent]);

  const canSubmit =
    intent &&
    message.trim().length >= 10 &&
    name.trim().length > 0 &&
    email.trim().length > 0;

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

    if (!canSubmit) return;

    setStatus("loading");
    setErrorMessage("");
    setFieldErrors({});

    try {
      if (captchaRequired && !captchaToken) {
        setStatus("error");
        setErrorMessage("Please complete the captcha.");
        return;
      }

      const body = `[${intent}]\n${message.trim()}`;

      const validation = contactSchema.safeParse({
        name: name.trim(),
        email: email.trim(),
        message: body,
        captchaToken: captchaToken || undefined,
      });
      if (!validation.success) {
        const errors: Record<string, string> = {};
        for (const issue of validation.error.issues) {
          const key = issue.path[0];
          if (key && !errors[String(key)]) {
            errors[String(key)] = issue.message;
          }
        }
        setFieldErrors(errors);
        setStatus("error");
        setErrorMessage("Please fix the highlighted fields.");
        return;
      }

      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: body,
          captchaToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Send failed");
      }

      posthog.capture("contact_submitted", { intent });

      setStatus("success");
      setMessage("");
      setName("");
      setEmail("");
      setIntent("");
      resetTurnstile();

      setTimeout(() => setStatus("idle"), 2800);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Failed to send. Try again or email directly.");
      resetTurnstile();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full"
      aria-live="polite"
    >
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Message intent">
        {INTENT_OPTIONS.map((option) => {
          const active = intent === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={intent === option}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded-sm border transition-colors ${
                active
                  ? "border-accent-400 bg-accent-400/15 text-accent-400"
                  : "border-border text-muted hover:text-secondary hover:border-overlay-30"
              }`}
              onClick={() => setIntent(option)}
            >
              {option}
            </button>
          );
        })}
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="What do you need? Be specific — objective, timeline, constraints."
        aria-label="Message"
        className="min-h-32 bg-input border border-border rounded-sm p-3 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono resize-y"
        maxLength={900}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          aria-label="Name"
          className="bg-input border border-border rounded-sm p-2.5 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          aria-label="Email"
          className="bg-input border border-border rounded-sm p-2.5 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono"
          required
        />
      </div>

      {turnstileSiteKey && (
        <div>
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-callback="turnstileCallback"
            data-expired-callback="turnstileExpiredCallback"
            aria-label="CAPTCHA verification"
          />
          {!captchaReady && (
            <p className="text-faint text-xs mt-2">Loading captcha...</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={
          status === "loading" ||
          status === "success" ||
          !canSubmit ||
          (captchaRequired ? !captchaToken : false)
        }
        className={`py-2.5 px-4 rounded-sm text-xs uppercase tracking-wider font-medium transition-colors ${
          status === "success"
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : status === "error"
              ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              : canSubmit
                ? "border border-accent-400/30 text-accent-400 hover:bg-accent-400/10"
                : "border border-border text-faint cursor-not-allowed"
        }`}
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <SpinnerGap className="animate-spin" size={14} /> sending
          </span>
        ) : status === "success" ? (
          "sent"
        ) : status === "error" ? (
          "retry"
        ) : (
          "send"
        )}
      </button>

      {errorMessage && <p className="text-red-400 text-xs">{errorMessage}</p>}
    </form>
  );
}
