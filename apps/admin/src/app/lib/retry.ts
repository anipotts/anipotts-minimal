export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delay * attempt));
      }
    }
  }
  throw lastError;
}
