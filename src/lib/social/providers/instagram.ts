import "server-only";

import { getMetaGraphVersion } from "../config";
import { decryptToken } from "../token-crypto";
import { socialTokenStore } from "../token-store";
import type { StoredSocialToken } from "../token-store";
import type { SocialAccountSummary } from "../types";

type InstagramAccountPayload = {
  id: string;
  username?: string;
  followers_count?: number;
  media_count?: number;
  profile_picture_url?: string;
};

type InstagramInsightPayload = {
  data?: Array<{
    name: string;
    values?: Array<{ value?: number }>;
  }>;
};

function latestInsight(payload: InstagramInsightPayload, name: string) {
  const metric = payload.data?.find((item) => item.name === name);
  const values = metric?.values;
  const latest = values?.[values.length - 1]?.value;

  return typeof latest === "number" ? latest : null;
}

export async function getInstagramSummary(
  token: StoredSocialToken,
): Promise<SocialAccountSummary> {
  const accessToken = decryptToken(token.accessTokenEncrypted);
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphVersion()}/${token.accountId}`,
  );
  url.searchParams.set(
    "fields",
    "id,username,followers_count,media_count,profile_picture_url",
  );
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    throw new Error(`Instagram provider failed with ${response.status}.`);
  }

  const account = (await response.json()) as InstagramAccountPayload;
  const insights = await getInstagramInsights(token.accountId, accessToken);
  const now = new Date().toISOString();
  const summary: SocialAccountSummary = {
    provider: "instagram",
    username: account.username ? `@${account.username}` : token.username ?? "Instagram",
    displayName: account.username ?? token.displayName,
    followers: account.followers_count ?? null,
    postsCount: account.media_count ?? null,
    today: {
      likes: null,
      comments: null,
      impressions: insights?.impressions ?? null,
      profileViews: insights?.profileViews ?? null,
      views: insights?.reach ?? null,
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

async function getInstagramInsights(accountId: string | undefined, accessToken: string) {
  if (!accountId) {
    return null;
  }

  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphVersion()}/${accountId}/insights`,
  );
  url.searchParams.set("metric", "impressions,reach,profile_views");
  url.searchParams.set("period", "day");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as InstagramInsightPayload;

  return {
    impressions: latestInsight(payload, "impressions"),
    reach: latestInsight(payload, "reach"),
    profileViews: latestInsight(payload, "profile_views"),
  };
}
