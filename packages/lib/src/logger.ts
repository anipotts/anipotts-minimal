type LogLevel = "info" | "warn" | "error";

const logger = {
  info: (context: string, message: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[${context}] ${message}`, data ?? "");
    }
  },
  warn: (context: string, message: string, data?: Record<string, unknown>) => {
    console.warn(`[${context}] ${message}`, data ?? "");
  },
  error: (context: string, message: string, data?: Record<string, unknown>) => {
    console.error(`[${context}] ${message}`, data ?? "");
  },
};

export type { LogLevel };
export { logger };
