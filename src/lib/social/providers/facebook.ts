import "server-only";

import { getMetaGraphVersion } from "../config";
import { decryptToken } from "../token-crypto";
import { socialTokenStore } from "../token-store";
import type { StoredSocialToken } from "../token-store";
import type { SocialAccountSummary } from "../types";

type FacebookPagePayload = {
  id: string;
  name?: string;
  followers_count?: number;
  fan_count?: number;
  link?: string;
};

type MetaInsightPayload = {
  data?: Array<{
    name: string;
    values?: Array<{ value?: number | Record<string, number> }>;
  }>;
};

function latestInsight(payload: MetaInsightPayload, name: string) {
  const metric = payload.data?.find((item) => item.name === name);
  const values = metric?.values;
  const latest = values?.[values.length - 1]?.value;

  return typeof latest === "number" ? latest : null;
}

export async function getFacebookSummary(
  token: StoredSocialToken,
): Promise<SocialAccountSummary> {
  const accessToken = decryptToken(token.accessTokenEncrypted);
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphVersion()}/${token.accountId}`,
  );
  url.searchParams.set("fields", "id,name,followers_count,fan_count,link");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    throw new Error(`Facebook provider failed with ${response.status}.`);
  }

  const page = (await response.json()) as FacebookPagePayload;
  const insights = await getFacebookInsights(token.accountId, accessToken);
  const now = new Date().toISOString();
  const summary: SocialAccountSummary = {
    provider: "facebook",
    username: token.username ?? page.name ?? "Facebook Page",
    displayName: page.name ?? token.displayName,
    profileUrl: page.link,
    followers: page.followers_count ?? page.fan_count ?? null,
    today: {
      views: insights?.views ?? null,
      likes: null,
      comments: null,
      shares: null,
      impressions: insights?.impressions ?? null,
    },
    trend: { value: null, direction: "unavailable" },
    lastUpdatedAt: now,
    source: "api",
    status: insights ? "success" : "partial",
    errorMessage: insights ? null : "Insights indisponiveis ou sem permissao.",
  };

  await socialTokenStore.updateToken(token.provider, {
    lastSyncedAt: now,
    status: "connected",
    errorMessage: summary.errorMessage,
  });

  return summary;
}

async function getFacebookInsights(accountId: string | undefined, accessToken: string) {
  if (!accountId) {
    return null;
  }

  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphVersion()}/${accountId}/insights`,
  );
  url.searchParams.set("metric", "page_impressions,page_views_total");
  url.searchParams.set("period", "day");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as MetaInsightPayload;

  return {
    impressions: latestInsight(payload, "page_impressions"),
    views: latestInsight(payload, "page_views_total"),
  };
}
