export const DEFAULT_STATE_API = "https://api.anipotts.com";

function readEnv(name: string): string | undefined {
  const value = import.meta.env[name] as string | undefined;
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getStateApi(): string {
  return (
    readEnv("PUBLIC_STATE_API") ??
    readEnv("VITE_PUBLIC_STATE_API") ??
    DEFAULT_STATE_API
  ).replace(/\/+$/, "");
}

export function getStateWs(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getStateApi().replace(/^http/, "ws")}${normalizedPath}`;
}
