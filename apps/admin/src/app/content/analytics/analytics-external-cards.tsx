import { getEnv } from "@anipotts/lib/env";
import { Section } from "@/components/shared/section";

export async function TypefullyCard() {
  const apiKey = getEnv("TYPEFULLY_API_KEY");

  if (!apiKey) {
    return (
      <Section title="Typefully">
        <p className="text-[12px] text-zinc-600">
          Connect Typefully by adding TYPEFULLY_API_KEY to your environment.
        </p>
      </Section>
    );
  }

  let draftCount = 0;
  let error: string | null = null;

  try {
    const res = await fetch("https://api.typefully.com/v1/drafts", {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      error = `API returned ${res.status}`;
    } else {
      const data = (await res.json()) as unknown[];
      draftCount = Array.isArray(data) ? data.length : 0;
    }
  } catch {
    error = "Failed to reach Typefully API";
  }

  if (error) {
    return (
      <Section title="Typefully">
        <p className="text-[12px] text-amber-400/70">{error}</p>
      </Section>
    );
  }

  return (
    <Section title="Typefully">
      <div className="flex items-baseline gap-2">
        <span className="text-[20px] font-medium text-zinc-100">
          {draftCount}
        </span>
        <span className="text-[11px] text-zinc-500">drafts in queue</span>
      </div>
    </Section>
  );
}

export function InstagramPlaceholder() {
  return (
    <Section title="Instagram">
      <p className="text-[12px] text-zinc-600">
        Connect Instagram to see post analytics here.
      </p>
    </Section>
  );
}

export function PostHogPlaceholder() {
  return (
    <Section title="PostHog">
      <a
        href="https://us.posthog.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors"
      >
        View Analytics
      </a>
    </Section>
  );
}
