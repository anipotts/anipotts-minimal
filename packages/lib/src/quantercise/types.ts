/** Quantercise admin API response types */

export interface QCEnv {
  QUANTERCISE_BASE_URL?: string;
  QUANTERCISE_ADMIN_TOKEN?: string;
}

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

export interface QCUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  signupDate?: string;
  lastActivity?: string;
  subscription: {
    status: "free" | "active" | "canceled" | "past_due";
    plan?: "monthly" | "annual";
    currentPeriodEnd?: string;
    stripeCustomerId?: string;
    source?: string;
    adminGranted?: boolean;
  };
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalPoints: number;
    currentStreak: number;
  };
}

export interface QCUsersResponse {
  users: QCUser[];
  total: number;
}

export interface QCFeatureFlag {
  key: string;
  name: string;
  active: boolean;
  rollout_percentage?: number;
}

export interface QCFeatureFlagsResponse {
  flags: QCFeatureFlag[];
}
