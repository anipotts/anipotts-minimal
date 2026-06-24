export type ApprovalBridgeField = {
  field: string;
  source: string;
  notes: string;
};

export type ApprovalBridgeDesign = {
  title: string;
  status: "design_only";
  transport: "future_imessage_bridge";
  inbound_contract: ApprovalBridgeField[];
  outbound_contract: ApprovalBridgeField[];
  hard_stops: string[];
};

export const approvalBridgeDesign: ApprovalBridgeDesign = {
  title: "future iMessage approval bridge",
  status: "design_only",
  transport: "future_imessage_bridge",
  inbound_contract: [
    {
      field: "approval_id",
      source: "Infra authority record",
      notes: "Stable id for the approval request shown in admin.",
    },
    {
      field: "mutation_id",
      source: "admin feed mutation row",
      notes: "The proposed state change that needs approval.",
    },
    {
      field: "allowed_reply",
      source: "bridge parser",
      notes: "Closed vocabulary only, such as approve, deny, revise, or stop.",
    },
    {
      field: "proof_ref",
      source: "admin proof row or handoff path",
      notes: "Metadata pointer only; no private payload or secret value.",
    },
  ],
  outbound_contract: [
    {
      field: "prompt",
      source: "admin blocked-by-Ani queue",
      notes: "Short approval question with scope, risk, and stop path.",
    },
    {
      field: "forbidden_actions",
      source: "authority or mutation row",
      notes: "Visible hard boundaries that the approval cannot exceed.",
    },
    {
      field: "expires_at",
      source: "authority record",
      notes: "Optional expiry for time-bound approvals.",
    },
    {
      field: "state",
      source: "bridge delivery lifecycle",
      notes: "Design states only for pending, sent, received, failed, or superseded.",
    },
  ],
  hard_stops: [
    "No outbound message send from admin without separate approval.",
    "No approval can mutate deploy, DNS, auth, env, secrets, launchd, or live services by itself.",
    "No private payload, health row, email body, message id, dollar amount, or secret value enters the bridge.",
    "No free-form reply can become authority without parser and proof validation.",
  ],
};
