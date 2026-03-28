"use client";

import { useState } from "react";
import { SpinnerGap } from "@phosphor-icons/react";
import { usePostHog } from "posthog-js/react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterSubscribe() {
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      posthog.capture("newsletter_subscribed");
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to subscribe. Try again.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm uppercase tracking-wider text-secondary font-mono">
        get my build notes
      </h3>
      <p className="text-sm text-tertiary leading-relaxed">
        Weekly thoughts on agents, dev tools, and building in public.
      </p>

      {status === "success" ? (
        <p className="text-sm text-green-400 py-2" role="status">
          You&apos;re in. Check your inbox.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address"
            required
            className="flex-1 bg-input border border-border rounded-sm p-2.5 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono"
          />
          <button
            type="submit"
            disabled={status === "loading" || !email.trim()}
            className={`px-4 py-2.5 rounded-sm text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap ${
              status === "loading"
                ? "border border-border text-faint cursor-wait"
                : email.trim()
                  ? "border border-accent-400/30 text-accent-400 hover:bg-accent-400/10"
                  : "border border-border text-faint cursor-not-allowed"
            }`}
          >
            {status === "loading" ? (
              <span className="inline-flex items-center gap-2">
                <SpinnerGap className="animate-spin" size={14} /> subscribing
              </span>
            ) : (
              "subscribe"
            )}
          </button>
        </form>
      )}

      <div aria-live="polite">
        {errorMessage && <p className="text-red-400 text-xs">{errorMessage}</p>}
      </div>
    </div>
  );
}
