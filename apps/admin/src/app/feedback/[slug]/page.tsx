import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getQCEnvForProject } from "@/lib/project-env-adapter";
import { getQCFeedback } from "@anipotts/lib/quantercise";
import { QCPageLayout } from "../../quantercise/components";
import ProjectSelector from "@/components/shared/project-selector";
import FeedbackList from "../feedback-list";

export const dynamic = "force-dynamic";

export default async function FeedbackProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || !project.capabilities.includes("feedback")) notFound();

  let feedback: Awaited<ReturnType<typeof getQCFeedback>> | null = null;
  try {
    feedback = await getQCFeedback(getQCEnvForProject(slug));
  } catch {
    feedback = null;
  }

  const issues = feedback?.data?.feedback ?? [];
  const hasMore = feedback?.meta?.hasMore ?? false;

  return (
    <QCPageLayout
      title="Feedback"
      actions={
        <ProjectSelector
          capability="feedback"
          currentSlug={slug}
          basePath="/feedback"
        />
      }
    >
      <FeedbackList
        initialFeedback={issues}
        initialHasMore={hasMore}
        slug={slug}
      />
    </QCPageLayout>
  );
}
