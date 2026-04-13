/** Quantercise admin API response types */

export interface QCEnv {
  QUANTERCISE_BASE_URL?: string;
  QUANTERCISE_ADMIN_TOKEN?: string;
}

// ── Dashboard ──

export interface QCDashboardMetrics {
  totalUsers: number;
  newUsersThisWeek: number;
  mrrCents: number;
  mrrGrowthPercent: number;
  activeToday: number;
  activeTodayVsAvg: number;
  usersOnlineNow: number;
  activeSessions: number;
  totalSubscribers: number;
}

export interface QCActivityEvent {
  id: string;
  eventType: string;
  userId: string;
  userEmail: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface QCAlerts {
  failedPayments: { count: number; amountCents: number };
  openFeedback: number;
  contentNeedingScript: number;
  activeDisputes: number;
  criticalErrors: number;
}

export interface QCQuickStats {
  passRate: number;
  passRateTrend: number;
  submissionsToday: number;
  avgSessionSeconds: number;
  churnRate: number;
  churnTrend: number;
  contentReady: number;
  contentScheduledToday: number;
}

export interface QCDashboard {
  metrics: QCDashboardMetrics;
  recentActivity: QCActivityEvent[];
  alerts: QCAlerts;
  newUsersWeek: Array<{ date: string; count: number }>;
  quickStats: QCQuickStats;
  contentStats: Record<string, number>;
  lastUpdated: string;
}

// ── Users ──

export interface QCUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  signupDate?: string;
  lastActivity?: string;
  subscription: {
    status: "free" | "active" | "canceled" | "past_due";
    plan?: "monthly" | "annual";
    currentPeriodEnd?: string;
    stripeCustomerId?: string;
    source?: "stripe" | "referral" | "house_referral" | "admin" | "unknown";
    referralCode?: string;
    adminGranted?: boolean;
  };
  stats?: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalPoints: number;
    currentStreak: number;
  };
}

export interface QCUsersListResponse {
  users: QCUser[];
  _meta: { count: number; fetchedAt: string; duration: number };
}

// ── Problems ──

export interface QCProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  difficultyScore: number;
  topic: string;
  tags: string[];
  isPreview: boolean;
  type: string;
  bodyMd: string;
  hints: string[];
  companies: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }> | null;
  constraints: string[];
  followUps: string[];
  whyThisMatters: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QCProblemsResponse {
  problems: QCProblem[];
  total: number;
  hasMore: boolean;
}

// ── Analytics ──

export interface QCAnalytics {
  totalUsers: number;
  activeUsers: { daily: number; weekly: number; monthly: number };
  subscriptionBreakdown: { free: number; monthly: number; annual: number };
  submissionStats: { total: number; passed: number; passRate: number };
  revenueEstimate: { monthly: number; annual: number; mrr: number };
  dailyActiveUsers: Array<{ date: string; count: number }>;
}

export interface QCRevenueAnalytics {
  currentMrr: number;
  previousMrr: number;
  mrrGrowth: number;
  arr: number;
  totalSubscribers: number;
  monthlySubscribers: number;
  annualSubscribers: number;
  avgRevenuePerUser: number;
  churnRate: number;
  ltv: number;
  revenueHistory: Array<{
    date: string;
    mrr: number;
    subscribers: number;
    newSubscribers: number;
    churned: number;
  }>;
  planBreakdown: {
    monthly: { count: number; revenue: number };
    annual: { count: number; revenue: number };
  };
}

export interface QCPaymentAnalytics {
  failedPayments: Array<{
    id: string;
    amount: number;
    customerEmail: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    created: number;
    attemptCount: number;
  }>;
  refunds: Array<{
    id: string;
    amount: number;
    reason: string | null;
    status: string;
    created: number;
  }>;
  disputes: Array<{
    id: string;
    amount: number;
    reason: string;
    status: string;
    created: number;
    dueBy: number | null;
  }>;
  summary: {
    totalFailedAmount: number;
    totalFailedCount: number;
    totalRefundedAmount: number;
    activeDisputeCount: number;
    paymentSuccessRate: number;
  };
  dunningStatus: {
    inRetry: number;
    pastDue: number;
    recoverable: number;
  };
}

// ── Feature Flags ──

export interface QCFeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  active: boolean;
  rolloutPercentage: number;
  category: string;
  filters?: {
    groups?: Array<{
      properties?: Array<{ key: string; value: unknown; operator: string }>;
      rollout_percentage?: number;
    }>;
  };
  created_at?: string;
  updated_at?: string;
}

export interface QCFeatureFlagsResponse {
  flags: QCFeatureFlag[];
  source: "posthog" | "mock";
}

// ── QA ──

export interface QCQAItem {
  id: string;
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  qaStatus: "unreviewed" | "verified" | "flagged" | "skipped";
  tags?: string[];
  severity?: "critical" | "high" | "medium" | "low";
}

export interface QCQAResponse {
  problems: QCQAItem[];
  total: number;
  filtered: number;
  stats?: {
    total: number;
    verified: number;
    flagged: number;
    skipped: number;
    unreviewed: number;
    byTag: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

// ── System Health ──

export interface QCObservability {
  health: Record<
    string,
    {
      service: string;
      status: "healthy" | "degraded" | "error";
      latency?: number;
      lastChecked: string;
      message?: string;
    }
  >;
  rateLimiting: {
    redisAvailable: boolean;
    inMemoryStoreSize: number;
    recentViolations: number;
  };
  metrics: {
    activeUsers24h: number;
    errorsLast1h: number;
    submissionsLast24h: number;
    avgResponseTimeMs: number;
  };
  lastUpdated: string;
}

export interface QCFailedEvent {
  id: string;
  source: string;
  status: "pending" | "resolved" | "dismissed" | "retrying";
  errorMessage: string;
  stack?: string;
  createdAt: string;
  updatedAt: string;
  resolutionNotes?: string;
}

export interface QCFailedEventsResponse {
  events: QCFailedEvent[];
  total: number;
  hasMore: boolean;
}

// ── User Actions ──

export type QCUserAction =
  | "grant_monthly"
  | "grant_annual"
  | "revoke_subscription"
  | "reset_stats"
  | "reset_progress"
  | "delete_user";

export interface QCActionResponse {
  success: true;
  message: string;
  details?: string[];
}

// ── Marketing ──

export interface QCTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
  author?: {
    username: string;
    name: string;
    profile_image_url: string;
  };
}

export interface QCRedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
}

export interface QCTwitterSearchResponse {
  data: {
    tweets: QCTweet[];
    searchMeta: { query: string; resultCount: number };
  };
}

export interface QCRedditSearchResponse {
  data: {
    posts: QCRedditPost[];
    searchMeta: {
      subredditsSearched: string[];
      keywordsUsed: string[];
      totalFound: number;
    };
  };
}

export interface QCTwitterStatusResponse {
  configured: boolean;
  message?: string;
}

// ── Feedback ──

export interface QCFeedbackIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
  pageUrl?: string;
  reportedBy?: string;
  contactEmail?: string;
  screenshot?: string;
}

export interface QCFeedbackResponse {
  data: { feedback: QCFeedbackIssue[] };
  meta: { hasMore: boolean; page: number; perPage: number };
}
