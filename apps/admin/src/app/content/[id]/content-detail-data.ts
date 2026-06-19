import { getDrizzle, parseJsonArray, schema, eq, desc } from "@anipotts/lib/db";
import type { Atom, Thought } from "@anipotts/types";

export type ContentDetailData = {
  thought: Thought;
  atoms: Atom[];
};

export async function getContentDetail(
  id: string,
): Promise<ContentDetailData | null> {
  const db = getDrizzle();
  if (!db) return null;

  const thoughtRows = await db
    .select()
    .from(schema.thoughts)
    .where(eq(schema.thoughts.id, id));

  const thoughtRow = thoughtRows[0];
  if (!thoughtRow) return null;

  const thought = {
    ...thoughtRow,
    tags: parseJsonArray(thoughtRow.tags),
    platforms_targeted: parseJsonArray(thoughtRow.platforms_targeted),
    platforms_posted: parseJsonArray(thoughtRow.platforms_posted),
    views: thoughtRow.views ?? 0,
  } as unknown as Thought;

  const atomRows = await db
    .select()
    .from(schema.atoms)
    .where(eq(schema.atoms.content_id, id))
    .orderBy(desc(schema.atoms.created_at));

  const atoms = atomRows.map(
    (row) =>
      ({
        ...row,
        hashtags: parseJsonArray(row.hashtags),
      }) as unknown as Atom,
  );

  return { thought, atoms };
}
