import { getQCQA } from "@anipotts/lib/quantercise";
import type { QCQAResponse } from "@anipotts/lib/quantercise";
import { getQCEnv, ErrorPanel } from "../components";
import { QAFilterBar, QAProblemsPanel, QAStatsBar } from "./qa-sections";

export type QAQuery = {
  status?: string;
  difficulty?: string;
};

export async function QAContent({ status, difficulty }: QAQuery) {
  let data: QCQAResponse;

  try {
    data = await getQCQA(getQCEnv(), {
      status,
      difficulty,
      includeStats: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="QA" message={msg} />;
  }

  const { problems, total, filtered, stats } = data;

  return (
    <>
      {stats && <QAStatsBar stats={stats} />}
      <QAFilterBar
        status={status}
        difficulty={difficulty}
        filtered={filtered}
        total={total}
      />
      <QAProblemsPanel problems={problems} />
    </>
  );
}
