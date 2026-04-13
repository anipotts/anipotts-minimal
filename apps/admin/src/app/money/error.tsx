"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function MoneyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Money" error={error} reset={reset} />;
}
