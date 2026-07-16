import type { APIRoute } from "astro";
import { refreshCareerProjection } from "../../../../lib/career-projections";
import { requireMachineToken } from "../../../../lib/native-auth";
import { handlePasskeyError } from "../../../../lib/passkey-auth";
export const POST: APIRoute = async (context) => {
  const token = await requireMachineToken(context, "projections:write");
  if (token instanceof Response) return token;
  try {
    return await refreshCareerProjection(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
