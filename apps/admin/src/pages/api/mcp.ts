import {
  adminMcpManifest,
  handleAdminMcpRequest,
  loadAdminControlSnapshot,
  type McpJsonRpcRequest,
} from "@anipotts/lib/admin-control";
import { requireMachineToken } from "../../lib/native-auth";

type EndpointContext = {
  locals: App.Locals;
  request: Request;
};

export async function GET({ locals, request }: EndpointContext) {
  const auth = await requireMachineToken({ locals, request }, "mcp:read");
  if (auth instanceof Response) return auth;

  const snapshot = await loadAdminControlSnapshot(locals.runtime?.env.DB);
  return Response.json(adminMcpManifest(snapshot), {
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function POST({ locals, request }: EndpointContext) {
  const auth = await requireMachineToken({ locals, request }, "mcp:read");
  if (auth instanceof Response) return auth;

  const snapshot = await loadAdminControlSnapshot(locals.runtime?.env.DB);
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
