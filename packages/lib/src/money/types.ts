export interface MercuryAccount {
  id: string;
  name: string;
  currentBalance: number;
  availableBalance: number;
  type: "checking" | "savings";
}

export interface MercuryTransaction {
  id: string;
  amount: number;
  counterpartyName: string;
  note: string | null;
  status: string;
  createdAt: string;
  dashDate: string;
  kind: "debit" | "credit";
}

export interface MercurySnapshot {
  checking: MercuryAccount | null;
  savings: MercuryAccount | null;
  recentTransactions: MercuryTransaction[];
  error: string | null;
  fetchedAt: string;
}

export interface Deal {
  company: string;
  agency: string;
  contactName: string;
  status: string;
  platform: string;
  paymentStatus: string;
  rateEnvVar: string;
  started: string;
  completed: string;
  firstContact: string;
  notes: string;
  postingPeriod: string;
}

export interface Deadline {
  date: string;
  description: string;
  type: string;
  status?: string;
  notes?: string;
  isOverdue: boolean;
  isUpcoming: boolean;
  daysUntil: number;
}

export interface RevenueStream {
  name: string;
  type: string;
  frequency: string;
  platform: string;
  status: string;
  flowsThroughLlc: boolean;
  notes: string;
}

export interface Domain {
  name: string;
  registrar: string;
  project: string;
  verdict: string;
  tier?: string;
  notes?: string;
}

export interface VentureHealth {
  name: string;
  url: string;
  platform: string;
  status: "up" | "down" | "unknown";
  responseTimeMs: number | null;
  checkedAt: string;
}

export interface ContentPipelineStats {
  drafts: number;
  ready: number;
  published: number;
  total: number;
}
