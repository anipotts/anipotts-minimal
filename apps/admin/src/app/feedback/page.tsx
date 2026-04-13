import { getQCFeedback } from "@anipotts/lib/quantercise";
import { getQCEnv } from "@/lib/qc-env";
import { QCPageLayout } from "../quantercise/components";
import FeedbackList from "./feedback-list";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  let feedback: Awaited<ReturnType<typeof getQCFeedback>> | null = null;

  try {
    feedback = await getQCFeedback(getQCEnv());
  } catch {
    feedback = null;
  }

  const issues = feedback?.data?.feedback ?? [];
  const hasMore = feedback?.meta?.hasMore ?? false;

  return (
    <QCPageLayout
      title="Feedback"
      actions={
        <span className="text-[10px] text-zinc-600">
          Quantercise GitHub issues
        </span>
      }
    >
      <FeedbackList initialFeedback={issues} initialHasMore={hasMore} />
    </QCPageLayout>
  );
}
