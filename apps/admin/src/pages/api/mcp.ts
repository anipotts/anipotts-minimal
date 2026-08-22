import {
  adminMcpManifest,
  handleAdminMcpRequest,
  loadAdminControlSnapshot,
  type McpJsonRpcRequest,
} from "@anipotts/lib/admin-control";
import { requireMcpReadToken } from "../../lib/admin-machine-tokens";

type EndpointContext = {
  locals: App.Locals;
  request: Request;
  url: URL;
};

const PRIVATE_HEADERS = {
  "cache-control": "private, no-store",
  pragma: "no-cache",
  vary: "authorization",
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
  try {
    await requireMcpReadToken(context);
    return null;
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: "mcp_bearer_token_required", mode: "read-only mcp" },
      { status: 401, headers: PRIVATE_HEADERS },
    );
  }
}
