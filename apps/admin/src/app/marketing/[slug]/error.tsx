"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function MarketingSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Marketing" error={error} reset={reset} />;
}
