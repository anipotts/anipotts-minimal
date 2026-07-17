export async function runAdminAction({
  actionId,
  claim,
  prove,
  adapter,
  journal,
  now = () => new Date(),
}) {
  const recovery = await journal.load();
  if (recovery) {
    if (recovery.stage !== "accepted") {
      throw new Error("action outcome requires explicit reconciliation");
    }
    await prove(recovery.request);
    await journal.remove();
    return {
      ok: true,
      action_id: actionId,
      status: "succeeded",
      recovered: true,
    };
  }

  const claimed = await claim({});
  const proofBase = { claim_handle: claimed.claim_handle };
  await journal.save({
    stage: "claimed",
    action_id: actionId,
    claim_handle: claimed.claim_handle,
    action_type: claimed.action_type,
    expires_at: claimed.expires_at,
  });
  if (Date.parse(claimed.expires_at) <= now().getTime()) {
    await prove({
      ...proofBase,
      succeeded: false,
      error_code: "expired_before_execution",
      proof: {
        provider: providerFor(claimed.action_type),
        observed_at: now().toISOString(),
        summary: "action expired before provider execution",
        provider_state: "not_started",
      },
    });
    await journal.remove();
    throw new Error("action expired before provider execution");
  }

  let proof;
  try {
    proof = adapter(claimed.action_type, claimed.payload);
  } catch (error) {
    const unknownRequest = {
      ...proofBase,
      succeeded: false,
      error_code: "provider_outcome_unknown",
      proof: {
        provider: providerFor(claimed.action_type),
        observed_at: now().toISOString(),
        summary: "provider command outcome could not be confirmed",
        provider_state: "unknown",
      },
    };
    await journal.save({
      stage: "outcome_unknown",
      action_id: actionId,
      claim_handle: claimed.claim_handle,
      request: unknownRequest,
    });
    await prove(unknownRequest);
    await journal.remove();
    throw error;
  }
  const recoveryEntry = {
    stage: "accepted",
    action_id: actionId,
    request: { ...proofBase, succeeded: true, proof },
  };
  await journal.save(recoveryEntry);
  await prove(recoveryEntry.request);
  await journal.remove();
  return {
    ok: true,
    action_id: actionId,
    status: "succeeded",
    recovered: false,
  };
}

function providerFor(type) {
  return type.includes("gmail")
    ? "gmail"
    : type.includes("calendar")
      ? "calendar"
      : "tracker";
}
