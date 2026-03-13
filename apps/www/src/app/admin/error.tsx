"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <h2 className="text-lg font-semibold text-zinc-100 mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-zinc-500 mb-4 max-w-md">
        {error.message || "An unexpected error occurred. Supabase might be temporarily unavailable."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
