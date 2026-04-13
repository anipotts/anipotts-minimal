import { getQCTwitterStatus } from "@anipotts/lib/quantercise";
import { getQCEnv } from "@/lib/qc-env";
import { QCPageLayout } from "../quantercise/components";
import MarketingTabs from "./marketing-tabs";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  let twitterConfigured = false;

  try {
    const status = await getQCTwitterStatus(getQCEnv());
    twitterConfigured = status.configured;
  } catch {
    twitterConfigured = false;
  }

  return (
    <QCPageLayout
      title="Marketing"
      actions={
        <span className="text-[10px] text-zinc-600">
          Quantercise social monitoring
        </span>
      }
    >
      <MarketingTabs twitterConfigured={twitterConfigured} />
    </QCPageLayout>
  );
}
