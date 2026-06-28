import { loadRuntimeOverlayResponse } from "../../../data/runtime";

export async function GET() {
  return Response.json(await loadRuntimeOverlayResponse());
}
