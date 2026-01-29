/**
 * HTTP health check utilities for status monitoring.
 * Performs lightweight HEAD requests to determine service availability.
 */

export interface StatusCheckResult {
  serviceUrl: string;
  serviceName: string;
  statusCode: number | null;
  responseTimeMs: number;
  isUp: boolean;
  checkedAt: string;
}

/**
 * Check if a service is up by sending an HTTP HEAD request.
 * Falls back to GET if HEAD returns 405.
 * Considers 2xx and 3xx status codes as "up".
 */
export async function checkService(
  url: string,
  name: string,
  timeoutMs = 10000,
): Promise<StatusCheckResult> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    // Some servers reject HEAD — retry with GET
    if (res.status === 405) {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
    }

    clearTimeout(timeout);

    const responseTimeMs = Date.now() - start;
    const isUp = res.status >= 200 && res.status < 400;

    return {
      serviceUrl: url,
      serviceName: name,
      statusCode: res.status,
      responseTimeMs,
      isUp,
      checkedAt,
    };
  } catch (err) {
    return {
      serviceUrl: url,
      serviceName: name,
      statusCode: null,
      responseTimeMs: Date.now() - start,
      isUp: false,
      checkedAt,
    };
  }
}

/** Check multiple services in parallel. */
export async function checkAllServices(
  services: { name: string; url: string }[],
): Promise<StatusCheckResult[]> {
  return Promise.all(
    services.map((s) => checkService(s.url, s.name)),
  );
}
