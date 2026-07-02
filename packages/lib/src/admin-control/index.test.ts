import { describe, expect, it } from "vitest";
import {
  ADMIN_EVENT_SCHEMA_VERSION,
  adminMcpManifest,
  handleAdminMcpRequest,
  loadAdminControlSnapshot,
} from "./index";

describe("admin-control", () => {
  it("loads fixture projections with schema version and event refs", async () => {
    const snapshot = await loadAdminControlSnapshot(null);

    expect(snapshot.schema_version).toBe(ADMIN_EVENT_SCHEMA_VERSION);
    expect(snapshot.source_mode).toBe("fixture");
    expect(snapshot.projections.inbox_items.length).toBeGreaterThan(0);
    expect(
      snapshot.projections.inbox_items[0]?.event_refs.length,
    ).toBeGreaterThan(0);
    expect(snapshot.retention.payload_store).toBe("r2");
  });

  it("keeps checkpoint out of the piece statechart", async () => {
    const snapshot = await loadAdminControlSnapshot(null);

    expect(snapshot.contracts.piece_states).not.toContain("checkpoint");
    expect(snapshot.contracts.legal_piece_cycles).toEqual([
      "review -> draft",
      "published -> draft",
    ]);
  });

  it("exposes read-only mcp tools over the same projections", async () => {
    const snapshot = await loadAdminControlSnapshot(null);
    const manifest = adminMcpManifest(snapshot);

    expect(manifest.write_tools).toBe(
      "disabled-until-broker-and-signed-connect-diff",
    );

    const response = handleAdminMcpRequest(snapshot, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "admin.get_projection",
        arguments: { projection: "inbox_items" },
      },
    });

    expect(JSON.stringify(response)).toContain("inbox-admin-contract-review");
  });
});
