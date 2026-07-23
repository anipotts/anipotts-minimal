import {
  assertValidKnowledgeCards,
  buildKnowledgeContextBundle,
  getKnowledgeCard,
  knowledgeRetrievalContract,
  loadAdminControlSnapshot,
  type AdminControlDatabase,
  type KnowledgeSearchOptions,
} from "@anipotts/lib/admin-control";

export async function readAdminKnowledge(
  db: AdminControlDatabase,
  query = "",
  options: KnowledgeSearchOptions = {},
) {
  const snapshot = await loadAdminControlSnapshot(
    import.meta.env.DEV ? null : db,
  );
  assertValidKnowledgeCards(snapshot.projections.knowledge_cards);

  return {
    generated_at: snapshot.generated_at,
    source_mode: snapshot.source_mode,
    errors: snapshot.errors.filter((error) =>
      error.startsWith("admin_knowledge_cards"),
    ),
    contract: knowledgeRetrievalContract,
    bundle: buildKnowledgeContextBundle(
      snapshot.projections.knowledge_cards,
      query,
      options,
    ),
    cards: snapshot.projections.knowledge_cards,
  };
}

export async function readAdminKnowledgeCard(
  db: AdminControlDatabase,
  cardId: string,
) {
  const snapshot = await loadAdminControlSnapshot(
    import.meta.env.DEV ? null : db,
  );
  return getKnowledgeCard(snapshot.projections.knowledge_cards, cardId);
}
