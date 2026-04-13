"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function QuanterciseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Quantercise" error={error} reset={reset} />;
}
