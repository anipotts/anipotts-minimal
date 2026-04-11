"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function CodeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Code" error={error} reset={reset} />;
}
