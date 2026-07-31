import type {
  ControlCommandRecord,
  ControlCommandSubmission,
  ControlPlaneSnapshot,
} from "@anipotts/types";
import { verifyDeviceHandshake } from "./control-plane-auth";
import { CommandRelay } from "./do/command-relay";

export { CommandRelay };

type RelayStub = DurableObjectStub & {
  submitCommand(
    command: ControlCommandSubmission,
  ): Promise<ControlCommandRecord>;
  getSnapshot(limit?: number): Promise<ControlPlaneSnapshot>;
  consumeHandshakeNonce(nonce: string, deviceId: string): Promise<boolean>;
};

type Env = {
  COMMAND_RELAY: DurableObjectNamespace;
  CONTROL_PLANE_DEVICE_PUBLIC_JWK: string;
};

const handler: ExportedHandler<Env> = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const stub = env.COMMAND_RELAY.getByName("ap-mini") as RelayStub;
    if (url.pathname === "/commands" && request.method === "POST") {
      return Response.json(
        await stub.submitCommand(
          (await request.json()) as ControlCommandSubmission,
        ),
      );
    }
    if (url.pathname === "/snapshot" && request.method === "GET") {
      return Response.json(await stub.getSnapshot(8));
    }
    if (url.pathname === "/connect") {
      const handshake = await verifyDeviceHandshake(
        request,
        "ap-mini",
        env.CONTROL_PLANE_DEVICE_PUBLIC_JWK,
      );
      if (!handshake) {
        return Response.json({ error: "unauthorized_device" }, { status: 401 });
      }
      if (
        !(await stub.consumeHandshakeNonce(handshake.nonce, handshake.deviceId))
      ) {
        return Response.json(
          { error: "replayed_device_handshake" },
          { status: 409 },
        );
      }
      const headers = new Headers(request.headers);
      headers.set("x-control-device-verified", handshake.deviceId);
      return stub.fetch(new Request(request, { headers }));
    }
    return new Response("not found", { status: 404 });
  },
};

export default handler;
