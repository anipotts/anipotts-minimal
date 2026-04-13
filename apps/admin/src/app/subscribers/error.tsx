"use client";

import SpokeError from "@/components/shared/spoke-error";

export default function SubscribersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SpokeError title="Subscribers" error={error} reset={reset} />;
}
