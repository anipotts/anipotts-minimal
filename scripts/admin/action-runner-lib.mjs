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
    await prove(recovery);
    await journal.remove();
    return {
      ok: true,
      action_id: actionId,
      status: recovery.succeeded ? "succeeded" : "failed",
      recovered: true,
    };
  }

  const claimed = await claim({});
  const proofBase = { claim_handle: claimed.claim_handle };
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
    throw new Error("action expired before provider execution");
  }

  let proof;
  try {
    proof = adapter(claimed.action_type, claimed.payload);
  } catch (error) {
    await prove({
      ...proofBase,
      succeeded: false,
      error_code: "provider_command_failed",
      proof: {
        provider: providerFor(claimed.action_type),
        observed_at: now().toISOString(),
        summary: "provider command failed",
        provider_state: "rejected",
      },
    });
    throw error;
  }
  const recoveryEntry = { ...proofBase, succeeded: true, proof };
  await journal.save(recoveryEntry);
  await prove(recoveryEntry);
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
