CREATE TABLE IF NOT EXISTS admin_knowledge_cards (
  card_id TEXT PRIMARY KEY,
  entity_ref TEXT NOT NULL,
  domain TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_locator TEXT NOT NULL,
  source_native_id TEXT,
  canonical_host TEXT NOT NULL,
  canonical_path TEXT,
  sensitivity TEXT NOT NULL,
  reveal_policy TEXT NOT NULL,
  freshness_state TEXT NOT NULL,
  observed_at TEXT,
  stale_after_seconds INTEGER,
  content_hash TEXT NOT NULL,
  proof_refs TEXT NOT NULL DEFAULT '[]',
  lineage_refs TEXT NOT NULL DEFAULT '[]',
  related_card_ids TEXT NOT NULL DEFAULT '[]',
  retrieval_instructions TEXT NOT NULL,
  context_budget_tokens INTEGER NOT NULL DEFAULT 200,
  event_refs TEXT NOT NULL DEFAULT '[]',
  indexed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_knowledge_domain
  ON admin_knowledge_cards (domain, kind);

CREATE INDEX IF NOT EXISTS idx_admin_knowledge_entity
  ON admin_knowledge_cards (entity_ref);

CREATE INDEX IF NOT EXISTS idx_admin_knowledge_freshness
  ON admin_knowledge_cards (freshness_state, observed_at);
