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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-wide text-accent-400">
          get my build notes weekly
        </h2>
        {status !== "success" && (
          <button
            type="submit"
            form="newsletter-form"
            disabled={status === "loading" || !email.trim()}
            className={`px-3 py-1.5 rounded-sm text-xs uppercase tracking-[0.2em] transition-colors ${
              status === "loading"
                ? "border border-border text-faint cursor-wait"
                : email.trim()
                  ? "border border-accent-400/40 text-accent-400 hover:bg-accent-400/10"
                  : "border border-accent-400/40 text-accent-400/40 cursor-default"
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
        )}
      </div>

      {status === "success" ? (
        <p className="text-sm text-green-400 py-2" role="status">
          You&apos;re in. Check your inbox.
        </p>
      ) : (
        <form id="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address"
            required
            className="w-full bg-input border border-border rounded-sm p-2.5 text-sm text-body focus:border-accent-400/60 focus:outline-none transition-colors font-mono"
          />
        </form>
      )}

      <div aria-live="polite">
        {errorMessage && <p className="text-red-400 text-xs">{errorMessage}</p>}
      </div>
    </div>
  );
}
