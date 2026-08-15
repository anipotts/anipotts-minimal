import type {
  PublicCopyContext,
  PublicCopyFinding,
  PublicCopyRule,
} from "@anipotts/types";

interface AnalyzePublicCopyOptions {
  surfaceId: string;
  fieldPath?: string;
  context?: PublicCopyContext;
  sourceRef?: string;
}

const RULES: Array<{
  rule: PublicCopyRule;
  pattern: RegExp;
  suggestion: string;
}> = [
  {
    rule: "litotes",
    pattern: /\b(?:not|never)\s+(?:just|only|merely|simply)\b/gi,
    suggestion: "state the full positive claim directly",
  },
  {
    rule: "negative_definition",
    pattern:
      /\b(?:i|it|this|that|we|they|the work)\s+(?:is|are|was|were|'s|'re)\s+not\b/gi,
    suggestion: "define the subject by what it is",
  },
  {
    rule: "reversal_frame",
    pattern: /\bnot\b[^.!?\n]{1,160}\b(?:but|instead|rather)\b/gi,
    suggestion: "lead with the intended point and remove the reversal",
  },
  {
    rule: "reversal_frame",
    pattern: /\bless\b[^.!?\n]{1,160}\bmore\b/gi,
    suggestion: "lead with the strongest positive claim",
  },
  {
    rule: "negative_staccato",
    pattern: /(?:^|[.!?]\s+)no\s+[^.!?]{1,70}[.!?]\s+no\s+/gim,
    suggestion: "combine the ideas into one positive, specific sentence",
  },
  {
    rule: "rhetorical_understatement",
    pattern:
      /\b(?:isn't|aren't|wasn't|weren't|doesn't|don't|didn't)\s+(?:bad|small|simple|easy|minor|nothing)\b/gi,
    suggestion: "name the actual quality or magnitude",
  },
];

export function analyzePublicCopy(
  text: string,
  options: AnalyzePublicCopyOptions,
): PublicCopyFinding[] {
  const context = options.context ?? "evergreen";
  if (
    context === "quotation" ||
    context === "safety" ||
    context === "technical"
  ) {
    return [];
  }

  return RULES.flatMap(({ rule, pattern, suggestion }) => {
    pattern.lastIndex = 0;
    return Array.from(text.matchAll(pattern), (match) => ({
      rule,
      surfaceId: options.surfaceId,
      fieldPath: options.fieldPath ?? "copy",
      context,
      excerpt: match[0],
      suggestedRewrite: suggestion,
      severity: context === "evergreen" ? "blocker" : "review",
      sourceRef: options.sourceRef,
    }));
  });
}
