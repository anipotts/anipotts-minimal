import type { OperatorTaskState } from "./operator-work";

const displayCopy: Record<
  string,
  Pick<OperatorTaskState, "bounded_goal" | "next_action">
> = {
  "chief/site": {
    bounded_goal: "Build the quieter admin console.",
    next_action: "Finish local review and prepare the draft pull request.",
  },
  "chief/brand": {
    bounded_goal: "Finish the current Brand implementation.",
    next_action: "Verify the approved Brand boundary and return proof.",
  },
  "fleet/gates": {
    bounded_goal: "Prepare the next exact approval.",
    next_action: "Wait for source proof, then present one clear decision.",
  },
};

export function operatorTaskDisplay(task: OperatorTaskState) {
  return (
    displayCopy[task.canonical_title] ?? {
      bounded_goal: task.bounded_goal,
      next_action: task.next_action,
    }
  );
}
