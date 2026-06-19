import { Suspense } from "react";
import { getQCRevenue, getQCPayments } from "@anipotts/lib/quantercise";
import type {
  QCRevenueAnalytics,
  QCPaymentAnalytics,
} from "@anipotts/lib/quantercise";
import {
  getQCEnv,
  QCPageLayout,
  PanelSkeleton,
  ErrorPanel,
} from "../components";
import {
  DisputesPanel,
  DunningPanel,
  FailedPaymentsPanel,
  MRRChart,
  RevenuePanel,
  SubscribersPanel,
} from "./payments-panels";

export const dynamic = "force-dynamic";

async function PaymentsContent() {
  const env = getQCEnv();

  let revenue: QCRevenueAnalytics;
  let payments: QCPaymentAnalytics;
  try {
    [revenue, payments] = await Promise.all([
      getQCRevenue(env),
      getQCPayments(env),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Payments" message={msg} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <RevenuePanel data={revenue} />
      <SubscribersPanel data={revenue} />
      <DunningPanel data={payments} />
      <FailedPaymentsPanel data={payments} />
      <DisputesPanel data={payments} />
      <MRRChart data={revenue} />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <QCPageLayout title="Payments">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <PanelSkeleton title="Revenue" />
            <PanelSkeleton title="Subscribers" />
            <PanelSkeleton title="Dunning" />
            <PanelSkeleton title="Failed Payments" />
          </div>
        }
      >
        <PaymentsContent />
      </Suspense>
    </QCPageLayout>
  );
}
