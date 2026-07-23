import {
  adminMcpManifest,
  handleAdminMcpRequest,
  loadAdminControlSnapshot,
  type McpJsonRpcRequest,
} from "@anipotts/lib/admin-control";
import { verifyAccessIdentity } from "../../lib/passkey-auth";

type EndpointContext = {
  locals: App.Locals;
  request: Request;
  url: URL;
};

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  pragma: "no-cache",
  vary: "cf-access-jwt-assertion",
};

export async function GET(context: EndpointContext) {
  const auth = await requireMcpAccess(context);
  if (auth) return auth;

  const snapshot = await loadAdminControlSnapshot(
    context.locals.runtime?.env.DB,
  );
  return Response.json(adminMcpManifest(snapshot), {
    headers: PRIVATE_HEADERS,
  });
}

export async function POST(context: EndpointContext) {
  const auth = await requireMcpAccess(context);
  if (auth) return auth;

  const snapshot = await loadAdminControlSnapshot(
    context.locals.runtime?.env.DB,
  );
  const body = (await context.request
    .json()
    .catch(() => null)) as McpJsonRpcRequest | null;

  if (!body || typeof body !== "object") {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "invalid json-rpc body" },
      },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  return Response.json(handleAdminMcpRequest(snapshot, body), {
    headers: PRIVATE_HEADERS,
  });
}

async function requireMcpAccess(
  context: EndpointContext,
): Promise<Response | null> {
  const identity = await verifyAccessIdentity(context);
  if (identity.verified) return null;

  return Response.json(
    {
      error: "verified cloudflare access identity required",
      mode: "read-only mcp",
    },
    { status: 401, headers: PRIVATE_HEADERS },
  );
}
