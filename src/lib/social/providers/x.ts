import "server-only";

import { ensureFreshAccessToken } from "../oauth/refresh-token";
import { socialTokenStore } from "../token-store";
import type { StoredSocialToken } from "../token-store";
import type { SocialAccountSummary } from "../types";

type XUserPayload = {
  data: {
    id: string;
    name?: string;
    username?: string;
    public_metrics?: {
      followers_count?: number;
      following_count?: number;
      tweet_count?: number;
    };
  };
};

export async function getXSummary(
  token: StoredSocialToken,
): Promise<SocialAccountSummary> {
  const accessToken = await ensureFreshAccessToken(token);
  const url = new URL(
    token.accountId
      ? `https://api.twitter.com/2/users/${token.accountId}`
      : "https://api.twitter.com/2/users/me",
  );
  url.searchParams.set("user.fields", "public_metrics,username,name");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`X provider failed with ${response.status}.`);
  }

  const payload = (await response.json()) as XUserPayload;
  const metrics = payload.data.public_metrics;
  const now = new Date().toISOString();
  await socialTokenStore.updateToken(token.provider, {
    lastSyncedAt: now,
    status: "connected",
    errorMessage: null,
  });

  return {
    provider: "x",
    username: payload.data.username ? `@${payload.data.username}` : token.username ?? "X",
    displayName: payload.data.name ?? token.displayName,
    followers: metrics?.followers_count ?? null,
    following: metrics?.following_count ?? null,
    postsCount: metrics?.tweet_count ?? null,
    today: { likes: null, shares: null, comments: null, views: null },
    trend: { value: null, direction: "unavailable" },
    lastUpdatedAt: now,
    source: "api",
    status: "success",
  };
}
