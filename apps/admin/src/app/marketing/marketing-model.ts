export interface MarketingResponseTemplate {
  label: string;
  text: string;
}

export const DEFAULT_REDDIT_SUBREDDITS =
  "quant,QuantFinance,algotrading,financialcareers,cscareerquestions,mentalmath,learnmath,trading";

export const DEFAULT_REDDIT_KEYWORDS =
  "mental math,quantitative,quant interview,math practice";

export const REDDIT_RESPONSE_TEMPLATES = [
  {
    label: "Mental Math Practice",
    text: `If you're looking to sharpen your mental math for quant interviews, I built Quantercise for exactly this. It has timed drills across difficulty levels that mirror actual interview questions. Free tier available: https://quantercise.com`,
  },
  {
    label: "Quant Interview Prep",
    text: `For quant interview prep, I found that consistent daily practice matters more than cramming. Quantercise lets you do timed problem sets that scale in difficulty. The question bank covers probability, mental math, estimation, and logic: https://quantercise.com`,
  },
  {
    label: "Looking for Resources",
    text: `One resource I'd add to the list is Quantercise (https://quantercise.com). It focuses specifically on the quantitative reasoning and mental math side of things, with timed practice that adapts to your level.`,
  },
  {
    label: "Specific Firm Interview",
    text: `For that firm's interview style, the mental math round is usually the first filter. Quantercise has drills specifically designed for speed and accuracy under time pressure. Worth a look: https://quantercise.com`,
  },
  {
    label: "Generic",
    text: `Check out Quantercise (https://quantercise.com) if you haven't already. It's a practice platform for quantitative reasoning and mental math, designed around how these skills actually get tested in interviews.`,
  },
] satisfies MarketingResponseTemplate[];

export const TWITTER_RESPONSE_TEMPLATES = [
  {
    label: "Mental Math Practice",
    text: "If you're drilling mental math for quant interviews, check out quantercise.com. Timed problems across difficulty levels, designed for speed under pressure.",
  },
  {
    label: "Quant Interview Prep",
    text: "For quant prep, daily timed practice > cramming. quantercise.com has adaptive problem sets covering probability, estimation, mental math, and logic.",
  },
  {
    label: "Looking for Resources",
    text: "Adding quantercise.com to the list. Focuses on quantitative reasoning and mental math with timed drills that adapt to your level. Free tier available.",
  },
  {
    label: "Specific Firm Interview",
    text: "The mental math round is usually the first filter. quantercise.com has drills designed for exactly that kind of speed + accuracy test.",
  },
  {
    label: "Generic",
    text: "Worth checking out quantercise.com for quant reasoning practice. Timed drills, adaptive difficulty, built around how these skills actually get tested.",
  },
] satisfies MarketingResponseTemplate[];
