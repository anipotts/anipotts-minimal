"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function RecordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Record" error={error} reset={reset} />;
}
