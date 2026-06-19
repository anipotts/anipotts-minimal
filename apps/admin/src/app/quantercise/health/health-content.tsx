import {
  getQCFailedEvents,
  getQCObservability,
} from "@anipotts/lib/quantercise";
import type { QCFailedEvent, QCObservability } from "@anipotts/lib/quantercise";
import { ErrorPanel, getQCEnv } from "../components";
import {
  FailedEventsPanel,
  HealthMetricsPanel,
  RateLimitPanel,
  ServiceHealthPanel,
} from "./health-panels";

export async function HealthContent() {
  const env = getQCEnv();

  let observability: QCObservability;
  let events: QCFailedEvent[];
  try {
    const [obsRes, eventsRes] = await Promise.all([
      getQCObservability(env),
      getQCFailedEvents(env, { limit: 50 }),
    ]);
    observability = obsRes.data;
    events = eventsRes.events;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return <ErrorPanel title="Health" message={msg} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <ServiceHealthPanel data={observability} />
        <HealthMetricsPanel data={observability} />
        <RateLimitPanel data={observability} />
      </div>

      <FailedEventsPanel events={events} />
    </>
  );
}
