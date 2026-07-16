import type { APIRoute } from "astro";
import { openCareerSourceLink } from "../../../../lib/career-projections";
import { handlePasskeyError, json } from "../../../../lib/passkey-auth";
export const GET: APIRoute = async (context) => {
  if (!context.params.sourceLinkId)
    return json({ error: "source_link_id_required" }, { status: 400 });
  try {
    return await openCareerSourceLink(context, context.params.sourceLinkId);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
