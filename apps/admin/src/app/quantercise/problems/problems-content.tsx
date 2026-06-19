import { getQCProblems } from "@anipotts/lib/quantercise";
import { ErrorPanel, getQCEnv } from "../components";
import {
  ProblemsFilterBar,
  ProblemsPagination,
  ProblemsPanel,
} from "./problems-sections";

const PROBLEMS_PAGE_SIZE = 50;

export type ProblemsQuery = {
  search?: string;
  difficulty?: string;
  offset?: number;
};

export async function ProblemsContent({
  search,
  difficulty,
  offset,
}: ProblemsQuery) {
  let data: Awaited<ReturnType<typeof getQCProblems>>;

  try {
    data = await getQCProblems(getQCEnv(), {
      limit: PROBLEMS_PAGE_SIZE,
      offset: offset ?? 0,
      search,
      difficulty,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Problems" message={msg} />;
  }

  const { problems, total, hasMore } = data;
  const currentOffset = offset ?? 0;

  return (
    <>
      <ProblemsFilterBar
        search={search}
        difficulty={difficulty}
        total={total}
      />
      <ProblemsPanel search={search} problems={problems} />
      <ProblemsPagination
        search={search}
        difficulty={difficulty}
        currentOffset={currentOffset}
        hasMore={hasMore}
        limit={PROBLEMS_PAGE_SIZE}
      />
    </>
  );
}
