import type { QCProblem } from "@anipotts/lib/quantercise";
import {
  ProblemBodyPanel,
  ProblemExamplesPanel,
} from "./problem-detail-body-panels";
import {
  ProblemFollowUpsPanel,
  ProblemGuidancePanels,
  ProblemWhyPanel,
} from "./problem-detail-guidance-panels";
import {
  ProblemOverviewPanel,
  ProblemTimestampRow,
} from "./problem-detail-overview-panel";

export function ProblemDetailPanels({ problem }: { problem: QCProblem }) {
  return (
    <div className="space-y-4">
      <ProblemOverviewPanel problem={problem} />
      <ProblemBodyPanel problem={problem} />
      <ProblemExamplesPanel problem={problem} />
      <ProblemGuidancePanels problem={problem} />
      <ProblemFollowUpsPanel problem={problem} />
      <ProblemWhyPanel problem={problem} />
      <ProblemTimestampRow problem={problem} />
    </div>
  );
}
