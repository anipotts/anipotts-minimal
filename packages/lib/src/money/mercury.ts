import type {
  MercurySnapshot,
  MercuryAccount,
  MercuryTransaction,
} from "./types";

const MERCURY_API_BASE = "https://api.mercury.com/api/v1";
const MERCURY_TIMEOUT_MS = 5000;

interface MercuryApiAccount {
  id: string;
  name: string;
  currentBalance: number;
  availableBalance: number;
  type: string;
}

interface MercuryApiTransaction {
  id: string;
  amount: number;
  counterpartyName: string;
  note: string | null;
  status: string;
  createdAt: string;
  dashDate: string;
  kind: string;
}

async function mercuryFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${MERCURY_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(MERCURY_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Mercury API returned ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function toAccount(raw: MercuryApiAccount): MercuryAccount {
  return {
    id: raw.id,
    name: raw.name,
    currentBalance: raw.currentBalance,
    availableBalance: raw.availableBalance,
    type: raw.type === "savings" ? "savings" : "checking",
  };
}

function toTransaction(raw: MercuryApiTransaction): MercuryTransaction {
  return {
    id: raw.id,
    amount: raw.amount,
    counterpartyName: raw.counterpartyName,
    note: raw.note,
    status: raw.status,
    createdAt: raw.createdAt,
    dashDate: raw.dashDate,
    kind: raw.kind === "credit" ? "credit" : "debit",
  };
}

export async function getMercurySnapshot(env: {
  MERCURY_API_TOKEN?: string;
  MERCURY_ACCOUNT_ID_CHECKING?: string;
  MERCURY_ACCOUNT_ID_SAVINGS?: string;
}): Promise<MercurySnapshot> {
  // Strip secret-token: URI prefix if present (RFC 8959)
  const raw = env.MERCURY_API_TOKEN;
  const token = raw?.startsWith("secret-token:") ? raw.slice(13) : raw;
  const fetchedAt = new Date().toISOString();

  if (!token) {
    return {
      checking: null,
      savings: null,
      recentTransactions: [],
      error: "MERCURY_API_TOKEN not configured",
      fetchedAt,
    };
  }

  let checking: MercuryAccount | null = null;
  let savings: MercuryAccount | null = null;
  const transactions: MercuryTransaction[] = [];
  const errors: string[] = [];

  // Fetch checking account + transactions (independent from savings)
  if (env.MERCURY_ACCOUNT_ID_CHECKING) {
    try {
      const acct = await mercuryFetch<MercuryApiAccount>(
        `/account/${env.MERCURY_ACCOUNT_ID_CHECKING}`,
        token,
      );
      checking = toAccount(acct);
    } catch (e) {
      errors.push(`Checking: ${e instanceof Error ? e.message : "failed"}`);
    }

    try {
      const txResp = await mercuryFetch<{
        transactions: MercuryApiTransaction[];
      }>(
        `/account/${env.MERCURY_ACCOUNT_ID_CHECKING}/transactions?limit=10&offset=0`,
        token,
      );
      if (Array.isArray(txResp.transactions)) {
        transactions.push(...txResp.transactions.map(toTransaction));
      }
    } catch (e) {
      errors.push(`Transactions: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  // Fetch savings account (independent from checking)
  if (env.MERCURY_ACCOUNT_ID_SAVINGS) {
    try {
      const acct = await mercuryFetch<MercuryApiAccount>(
        `/account/${env.MERCURY_ACCOUNT_ID_SAVINGS}`,
        token,
      );
      savings = toAccount(acct);
    } catch (e) {
      errors.push(`Savings: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  return {
    checking,
    savings,
    recentTransactions: transactions,
    error: errors.length > 0 ? errors.join("; ") : null,
    fetchedAt,
  };
}
