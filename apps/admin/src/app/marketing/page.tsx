import { redirect } from "next/navigation";
import { getProjectsWithCapability } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function MarketingPage() {
  const projects = getProjectsWithCapability("marketing");
  const defaultSlug = projects[0]?.slug ?? "quantercise";
  redirect(`/marketing/${defaultSlug}`);
}
