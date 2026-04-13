import { redirect } from "next/navigation";
import { getProjectsWithCapability } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function FeedbackPage() {
  const projects = getProjectsWithCapability("feedback");
  const defaultSlug = projects[0]?.slug ?? "quantercise";
  redirect(`/feedback/${defaultSlug}`);
}
