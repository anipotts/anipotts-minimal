import {
  adminMcpManifest,
  handleAdminMcpRequest,
  loadAdminControlSnapshot,
  type McpJsonRpcRequest,
} from "@anipotts/lib/admin-control";
import { env } from "cloudflare:workers";

type EndpointContext = {
  request: Request;
};

export async function GET({ request }: EndpointContext) {
  const auth = requireMcpAccess(request);
  if (auth) return auth;

  const snapshot = await loadAdminControlSnapshot(env.DB);
  return Response.json(adminMcpManifest(snapshot), {
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function POST({ request }: EndpointContext) {
  const auth = requireMcpAccess(request);
  if (auth) return auth;

  const snapshot = await loadAdminControlSnapshot(env.DB);
  const body = (await request
    .json()
    .catch(() => null)) as McpJsonRpcRequest | null;

  if (!body || typeof body !== "object") {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "invalid json-rpc body" },
      },
      { status: 400 },
    );
  }

  return Response.json(handleAdminMcpRequest(snapshot, body), {
    headers: {
      "cache-control": "no-store",
    },
  });
}

function requireMcpAccess(request: Request): Response | null {
  if (import.meta.env.DEV) return null;

  const hasAccessIdentity =
    request.headers.has("cf-access-jwt-assertion") ||
    request.headers.has("cf-access-authenticated-user-email") ||
    request.headers.has("cf-access-client-id");

  if (hasAccessIdentity) return null;

  return Response.json(
    {
      error: "cloudflare access service-token identity required",
      mode: "read-only mcp",
    },
    { status: 401 },
  );
}
