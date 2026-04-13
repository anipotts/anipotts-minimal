"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function ContentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Content" error={error} reset={reset} />;
}
