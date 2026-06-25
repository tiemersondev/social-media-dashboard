import "server-only";

import { ensureFreshAccessToken } from "../oauth/refresh-token";
import { socialTokenStore } from "../token-store";
import type { StoredSocialToken } from "../token-store";
import type { SocialAccountSummary } from "../types";

type YouTubeChannelPayload = {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      customUrl?: string;
    };
    statistics?: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
      hiddenSubscriberCount?: boolean;
    };
  }>;
};

type YouTubeAnalyticsPayload = {
  rows?: Array<Array<string | number>>;
};

function parseMetric(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getYouTubeSummary(
  token: StoredSocialToken,
): Promise<SocialAccountSummary> {
  const accessToken = await ensureFreshAccessToken(token);
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("mine", "true");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`YouTube provider failed with ${response.status}.`);
  }

  const payload = (await response.json()) as YouTubeChannelPayload;
  const channel = payload.items?.[0];
  const statistics = channel?.statistics;
  const analytics = await getYouTubeAnalytics(accessToken);
  const now = new Date().toISOString();

  const summary: SocialAccountSummary = {
    provider: "youtube",
    username: channel?.snippet?.customUrl ?? token.username ?? "YouTube",
    displayName: channel?.snippet?.title ?? token.displayName,
    followers: null,
    subscribers: statistics?.hiddenSubscriberCount
      ? null
      : parseMetric(statistics?.subscriberCount),
    totalViews: parseMetric(statistics?.viewCount),
    postsCount: parseMetric(statistics?.videoCount),
    today: {
      views: analytics?.views ?? null,
      likes: analytics?.likes ?? null,
      comments: analytics?.comments ?? null,
    },
    trend: { value: null, direction: "unavailable" },
    lastUpdatedAt: now,
    source: "api",
    status: analytics ? "success" : "partial",
  };

  await socialTokenStore.updateToken(token.provider, {
    lastSyncedAt: now,
    status: summary.status === "partial" ? "connected" : "connected",
    errorMessage: analytics ? null : "Analytics indisponivel ou sem permissao.",
  });

  return summary;
}

async function getYouTubeAnalytics(accessToken: string) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 28);

  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.searchParams.set("ids", "channel==MINE");
  url.searchParams.set("startDate", start.toISOString().slice(0, 10));
  url.searchParams.set("endDate", end.toISOString().slice(0, 10));
  url.searchParams.set("metrics", "views,likes,comments,subscribersGained,subscribersLost");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as YouTubeAnalyticsPayload;
  const row = payload.rows?.[0];

  if (!row) {
    return null;
  }

  return {
    views: Number(row[0]) || null,
    likes: Number(row[1]) || null,
    comments: Number(row[2]) || null,
    subscribersGained: Number(row[3]) || null,
    subscribersLost: Number(row[4]) || null,
  };
}
