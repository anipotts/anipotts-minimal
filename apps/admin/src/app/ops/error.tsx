"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function OpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Ops" error={error} reset={reset} />;
}
