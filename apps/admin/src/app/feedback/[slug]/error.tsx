"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function FeedbackSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Feedback" error={error} reset={reset} />;
}
