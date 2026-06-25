import "server-only";

import { getMockDashboardSummary } from "@/data/mock-dashboard";
import {
  requireTokenEncryptionKey,
  getSocialDataMode,
  SOCIAL_REVALIDATE_SECONDS,
  SOCIAL_SYNC_RATE_LIMIT_MS,
} from "./config";
import { logSocialError } from "./errors";
import { getFacebookSummary } from "./providers/facebook";
import { getInstagramSummary } from "./providers/instagram";
import { getXSummary } from "./providers/x";
import { getYouTubeSummary } from "./providers/youtube";
import { socialTokenStore, type StoredSocialToken } from "./token-store";
import type {
  DashboardSummary,
  SocialAccountSummary,
  SocialProvider,
  SocialSyncStatus,
} from "./types";

const providerFetchers = {
  facebook: getFacebookSummary,
  instagram: getInstagramSummary,
  x: getXSummary,
  youtube: getYouTubeSummary,
} satisfies Record<
  SocialProvider,
  (token: StoredSocialToken) => Promise<SocialAccountSummary>
>;

type SyncOptions = {
  force?: boolean;
  provider?: SocialProvider;
};

type ProviderSyncResult = {
  provider: SocialProvider;
  status: SocialSyncStatus;
  account?: SocialAccountSummary;
};

function isExpired(token: StoredSocialToken) {
  return token.expiresAt ? new Date(token.expiresAt).getTime() <= Date.now() : false;
}

function isSnapshotFresh(collectedAt?: string | null) {
  if (!collectedAt) {
    return false;
  }

  return (
    Date.now() - new Date(collectedAt).getTime() <
    SOCIAL_REVALIDATE_SECONDS * 1000
  );
}

function isRateLimited(token: StoredSocialToken) {
  if (!token.lastSyncedAt) {
    return false;
  }

  return (
    Date.now() - new Date(token.lastSyncedAt).getTime() <
    SOCIAL_SYNC_RATE_LIMIT_MS
  );
}

function getFailureStatus(error: unknown): SocialSyncStatus {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("401") || message.includes("unauthorized")) {
    return "expired";
  }

  if (message.includes("403") || message.includes("permission")) {
    return "missing_scope";
  }

  if (message.includes("429") || message.includes("rate")) {
    return "rate_limited";
  }

  return "error";
}

function calculateTotal(accounts: SocialAccountSummary[]) {
  return accounts.reduce(
    (sum, account) => sum + (account.followers ?? account.subscribers ?? 0),
    0,
  );
}

function buildSummary(
  accounts: SocialAccountSummary[],
  statuses: Partial<Record<SocialProvider, SocialSyncStatus>>,
  hasConnections: boolean,
): DashboardSummary {
  const hasFailure = Object.values(statuses).some(
    (status) => status && status !== "success" && status !== "partial",
  );
  const hasPartial = Object.values(statuses).some((status) => status === "partial");

  const sortedUpdatedAt = accounts
    .map((account) => account.lastUpdatedAt)
    .sort();

  return {
    accounts,
    totalFollowers: calculateTotal(accounts),
    lastUpdatedAt: sortedUpdatedAt[sortedUpdatedAt.length - 1] ?? new Date().toISOString(),
    source: hasFailure || hasPartial ? "mixed" : "api",
    hasConnections,
    providerStatuses: statuses,
  };
}

async function collectProvider(token: StoredSocialToken): Promise<ProviderSyncResult> {
  try {
    if (isExpired(token) && !token.refreshTokenEncrypted) {
      await socialTokenStore.markStatus(
        token.provider,
        "expired",
        "Token expirado. Reconecte a conta.",
      );
      return { provider: token.provider, status: "expired" };
    }

    const account = await providerFetchers[token.provider](token);
    const status = account.status ?? "success";
    await socialTokenStore.saveSnapshot({
      provider: token.provider,
      accountId: token.accountId,
      data: account,
      collectedAt: account.lastUpdatedAt,
    });

    return {
      provider: token.provider,
      status,
      account,
    };
  } catch (error) {
    const status = getFailureStatus(error);
    await socialTokenStore.markStatus(
      token.provider,
      status === "expired"
        ? "expired"
        : status === "missing_scope"
          ? "missing_scope"
          : "error",
      status === "expired"
        ? "Token expirado. Reconecte a conta."
        : "Nao foi possivel sincronizar esta rede agora.",
    );
    logSocialError(`provider:${token.provider}`, error);
    return { provider: token.provider, status };
  }
}

async function getCachedAccount(provider: SocialProvider) {
  const snapshot = await socialTokenStore.getLatestSnapshot(provider);
  return snapshot?.data ?? null;
}

export async function syncSocialProviders(
  options: SyncOptions = {},
): Promise<{
  results: ProviderSyncResult[];
  summary: DashboardSummary;
}> {
  if (getSocialDataMode() === "mock") {
    const summary = getMockDashboardSummary();
    return {
      results: summary.accounts.map((account) => ({
        provider: account.provider,
        status: "success",
        account,
      })),
      summary,
    };
  }

  requireTokenEncryptionKey();

  const tokens = (await socialTokenStore.list()).filter((token) =>
    options.provider ? token.provider === options.provider : true,
  );
  const connectedTokens = tokens.filter((token) => token.status !== "error");

  if (connectedTokens.length === 0) {
    return {
      results: [],
      summary: buildSummary([], {}, false),
    };
  }

  const results = await Promise.all(
    connectedTokens.map(async (token) => {
      const cachedSnapshot = await socialTokenStore.getLatestSnapshot(token.provider);

      if (!options.force && cachedSnapshot && isSnapshotFresh(cachedSnapshot.collectedAt)) {
        return {
          provider: token.provider,
          status: cachedSnapshot.data.status ?? "success",
          account: cachedSnapshot.data,
        } satisfies ProviderSyncResult;
      }

      if (options.force && isRateLimited(token)) {
        return {
          provider: token.provider,
          status: "rate_limited",
          account: cachedSnapshot?.data,
        } satisfies ProviderSyncResult;
      }

      return collectProvider(token);
    }),
  );

  const accounts = results
    .map((result) => result.account)
    .filter((account): account is SocialAccountSummary => Boolean(account));
  const statuses = Object.fromEntries(
    results.map((result) => [result.provider, result.status]),
  ) as Partial<Record<SocialProvider, SocialSyncStatus>>;

  return {
    results,
    summary: buildSummary(accounts, statuses, true),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (getSocialDataMode() === "mock") {
    return getMockDashboardSummary();
  }

  requireTokenEncryptionKey();

  const tokens = await socialTokenStore.list();

  if (tokens.length === 0) {
    return buildSummary([], {}, false);
  }

  const results = await Promise.all(
    tokens.map(async (token) => {
      const cachedSnapshot = await socialTokenStore.getLatestSnapshot(token.provider);

      if (cachedSnapshot && isSnapshotFresh(cachedSnapshot.collectedAt)) {
        return {
          provider: token.provider,
          status: cachedSnapshot.data.status ?? "success",
          account: cachedSnapshot.data,
        } satisfies ProviderSyncResult;
      }

      if (isRateLimited(token) && cachedSnapshot) {
        return {
          provider: token.provider,
          status: "rate_limited",
          account: cachedSnapshot.data,
        } satisfies ProviderSyncResult;
      }

      return collectProvider(token);
    }),
  );

  const accounts = await Promise.all(
    results.map(async (result) => result.account ?? getCachedAccount(result.provider)),
  );
  const realAccounts = accounts.filter(
    (account): account is SocialAccountSummary => Boolean(account),
  );
  const statuses = Object.fromEntries(
    results.map((result) => [result.provider, result.status]),
  ) as Partial<Record<SocialProvider, SocialSyncStatus>>;

  return buildSummary(realAccounts, statuses, true);
}
