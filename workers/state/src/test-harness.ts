import type {
  ControlCommandRecord,
  ControlCommandSubmission,
  ControlPlaneSnapshot,
} from "@anipotts/types";
import { CommandRelay } from "./do/command-relay";

export { CommandRelay };

type RelayStub = DurableObjectStub & {
  submitCommand(
    command: ControlCommandSubmission,
  ): Promise<ControlCommandRecord>;
  getSnapshot(limit?: number): Promise<ControlPlaneSnapshot>;
};

type Env = {
  COMMAND_RELAY: DurableObjectNamespace;
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
      const headers = new Headers(request.headers);
      headers.set("x-control-device-verified", "ap-mini");
      return stub.fetch(new Request(request, { headers }));
    }
    return new Response("not found", { status: 404 });
  },
};

export default handler;
