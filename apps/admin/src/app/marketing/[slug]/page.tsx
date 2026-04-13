import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getQCEnvForProject } from "@/lib/project-env-adapter";
import { getQCTwitterStatus } from "@anipotts/lib/quantercise";
import { QCPageLayout } from "../../quantercise/components";
import ProjectSelector from "@/components/shared/project-selector";
import MarketingTabs from "../marketing-tabs";

export const dynamic = "force-dynamic";

export default async function MarketingProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || !project.capabilities.includes("marketing")) notFound();

  let twitterConfigured = false;
  try {
    const status = await getQCTwitterStatus(getQCEnvForProject(slug));
    twitterConfigured = status.configured;
  } catch {
    twitterConfigured = false;
  }

  return (
    <QCPageLayout
      title="Marketing"
      actions={
        <ProjectSelector
          capability="marketing"
          currentSlug={slug}
          basePath="/marketing"
        />
      }
    >
      <MarketingTabs twitterConfigured={twitterConfigured} slug={slug} />
    </QCPageLayout>
  );
}
