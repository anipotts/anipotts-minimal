import { requireAuth } from "../actions";

export function withAuth<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
): (...args: Args) => Promise<R | { error: string }> {
  return async (...args: Args) => {
    const authError = await requireAuth();
    if (authError) return authError;
    return fn(...args);
  };
}
