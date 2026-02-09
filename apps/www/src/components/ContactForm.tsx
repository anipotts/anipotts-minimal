"use client";

import { useState } from "react";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { usePostHog } from "posthog-js/react";

export default function ContactForm() {
  const posthog = usePostHog();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to send");

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
      posthog.capture("contact_form_submitted");

      // Reset success message after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again or email me directly.");
      posthog.capture("contact_form_error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <input
            id="name"
            required
            className="bg-input border border-border rounded-sm p-2 text-sm text-body focus:border-accent-400/50 focus:outline-none transition-colors font-mono placeholder-faint"
            placeholder="Your Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={status === "loading"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <input
            id="email"
            type="email"
            required
            className="bg-input border border-border rounded-sm p-2 text-sm text-body focus:border-accent-400/50 focus:outline-none transition-colors font-mono placeholder-faint"
            placeholder="Your Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={status === "loading"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <textarea
          id="message"
          required
          rows={4}
          maxLength={1000}
          className="bg-input border border-border rounded-sm p-2 text-sm text-body focus:border-accent-400/50 focus:outline-none transition-colors font-mono placeholder-faint resize-none"
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

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className={`mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-sm text-xs uppercase tracking-widest font-bold transition-all duration-300 ${
          status === "success"
            ? "bg-green-500/10 text-green-400 border border-green-500/20 cursor-default"
            : status === "error"
            ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
            : "bg-accent-400/10 text-accent-400 border border-accent-400/20 hover:bg-accent-400/20"
        }`}
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
