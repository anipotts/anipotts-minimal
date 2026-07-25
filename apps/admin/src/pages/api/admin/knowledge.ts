import type { APIRoute } from "astro";
import {
  readAdminKnowledge,
  readAdminKnowledgeCard,
} from "../../../data/knowledge";
import type { KnowledgeDomain } from "@anipotts/lib/admin-control";

const DOMAINS = new Set<KnowledgeDomain>([
  "work",
  "content",
  "life",
  "fleet",
  "system",
]);

export const GET: APIRoute = async (context) => {
  const cardId = context.url.searchParams.get("card_id");
  if (cardId) {
    const card = await readAdminKnowledgeCard(
      context.locals.runtime?.env.DB,
      cardId,
    );
    if (!card) {
      return Response.json(
        { error: `unknown knowledge card: ${cardId}` },
        { status: 404 },
      );
    }
    return Response.json(card, {
      headers: { "cache-control": "no-store" },
    });
  }

  const query = context.url.searchParams.get("q") ?? "";
  const domainParam = context.url.searchParams.get("domain");
  const domain =
    domainParam && DOMAINS.has(domainParam as KnowledgeDomain)
      ? (domainParam as KnowledgeDomain)
      : null;
  const limit = parseBoundedInteger(
    context.url.searchParams.get("limit"),
    1,
    20,
  );
  const contextBudget = parseBoundedInteger(
    context.url.searchParams.get("context_budget_tokens"),
    100,
    4_000,
  );
  const knowledge = await readAdminKnowledge(
    context.locals.runtime?.env.DB,
    query,
    {
      domain,
      limit: limit ?? undefined,
      context_budget_tokens: contextBudget ?? undefined,
    },
  );

  return Response.json(knowledge, {
    headers: { "cache-control": "no-store" },
  });
};

function parseBoundedInteger(
  value: string | null,
  minimum: number,
  maximum: number,
): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(minimum, Math.min(maximum, parsed));
}
