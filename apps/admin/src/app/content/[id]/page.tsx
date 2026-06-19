import { notFound } from "next/navigation";
import { getContentDetail } from "./content-detail-data";
import { ContentDetailShell } from "./content-detail-shell";

export const dynamic = "force-dynamic";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contentDetail = await getContentDetail(id);

  if (!contentDetail) notFound();

  return <ContentDetailShell {...contentDetail} />;
}
