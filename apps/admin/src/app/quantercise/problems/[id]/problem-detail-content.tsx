import { notFound } from "next/navigation";
import { getQCProblem } from "@anipotts/lib/quantercise";
import { ErrorPanel, getQCEnv } from "../../components";
import { ProblemDetailPanels } from "./problem-detail-sections";

export async function ProblemDetailContent({ id }: { id: string }) {
  let data: Awaited<ReturnType<typeof getQCProblem>>;

  try {
    data = await getQCProblem(getQCEnv(), id);
  } catch (e) {
    if (e instanceof Error && e.message.includes("404")) {
      notFound();
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Problem" message={msg} />;
  }

  return <ProblemDetailPanels problem={data.problem} />;
}
