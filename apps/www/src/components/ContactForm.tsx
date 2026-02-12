"use client";

import { useEffect, useState } from "react";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { usePostHog } from "posthog-js/react";

export default function ContactForm() {
  const posthog = usePostHog();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const statusStyles: Record<typeof status, string> = {
    idle: "bg-accent-400/10 text-accent-400 border border-accent-400/20 hover:bg-accent-400/20",
    loading: "bg-accent-400/10 text-accent-400 border border-accent-400/20 hover:bg-accent-400/20",
    success: "bg-green-500/10 text-green-400 border border-green-500/20 cursor-default",
    error: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
  };

  const resetTurnstile = () => {
    if (turnstileSiteKey) {
      const win = window as unknown as { turnstile?: { reset?: () => void } };
      win.turnstile?.reset?.();
      setCaptchaToken("");
    }
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

    const existing = document.querySelector("script[data-turnstile]");
    if (existing) {
      setCaptchaReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-turnstile", "true");
    script.onload = () => setCaptchaReady(true);
    script.onerror = () => setCaptchaReady(false);
    document.body.appendChild(script);
  }, [turnstileSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      if (turnstileSiteKey && !captchaToken) {
        setStatus("error");
        setErrorMessage("Please complete the captcha.");
        return;
      }

      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken }),
      });

      if (!res.ok) throw new Error("Failed to send");

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
      resetTurnstile();
      posthog?.capture("contact_form_submitted");

      // Reset success message after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again or email me directly.");
      resetTurnstile();
      posthog?.capture("contact_form_error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label htmlFor="name" className="sr-only">Full name</label>
        <input
          id="name"
          required
          className="bg-input border border-border rounded-sm p-2 text-base text-body focus:border-accent-400/50 focus:outline-none transition-colors font-mono placeholder-faint"
          placeholder="Your Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={status === "loading"}
        />
        <label htmlFor="email" className="sr-only">Email address</label>
        <input
          id="email"
          type="email"
          required
          className="bg-input border border-border rounded-sm p-2 text-base text-body focus:border-accent-400/50 focus:outline-none transition-colors font-mono placeholder-faint"
          placeholder="Your Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={status === "loading"}
        />
      </div>

      <div>
        <label htmlFor="message" className="sr-only">Message</label>
        <textarea
          id="message"
          required
          rows={4}
          maxLength={1000}
          className="bg-input border border-border rounded-sm p-2 text-base text-body focus:border-accent-400/50 focus:outline-none transition-colors font-mono placeholder-faint resize-none"
          placeholder="Your Message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          disabled={status === "loading"}
        />
        <div className="flex justify-end">
          <span className={`text-xs ${formData.message.length > 1000 ? "text-red-400" : "text-faint"}`}>
            {formData.message.length}/1000
          </span>
        </div>
      </div>

      {turnstileSiteKey && (
        <div className="mt-2">
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
        disabled={status === "loading" || status === "success" || (turnstileSiteKey ? !captchaToken : false)}
        className={`mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-sm text-xs uppercase tracking-widest font-bold transition-all duration-300 ${statusStyles[status]}`}
      >
        {status === "loading" ? (
          <>
            <SpinnerGap className="animate-spin" size={14} /> Sending...
          </>
        ) : status === "success" ? (
          "Message Sent"
        ) : status === "error" ? (
          "Failed - Try Again"
        ) : (
          <>
            Send Message <PaperPlaneTilt size={12} />
          </>
        )}
      </button>
      {errorMessage && (
        <p className="text-red-400 text-xs mt-1">{errorMessage}</p>
      )}
    </form>
  );
}
