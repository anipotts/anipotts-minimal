export type PublicCopyContext =
  | "evergreen"
  | "historical"
  | "quotation"
  | "safety"
  | "technical";

export type PublicCopyRule =
  | "litotes"
  | "reversal_frame"
  | "negative_definition"
  | "negative_staccato"
  | "rhetorical_understatement";

export interface PublicCopyFinding {
  rule: PublicCopyRule;
  surfaceId: string;
  fieldPath: string;
  context: PublicCopyContext;
  excerpt: string;
  suggestedRewrite: string;
  severity: "blocker" | "review";
  sourceRef?: string;
}
