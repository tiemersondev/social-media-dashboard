import type { DashboardSummary, SocialAccountSummary } from "@/lib/social/types";
import { overviewStats, stats } from "./dashboard";

function parseCompactNumber(value: string): number | null {
  const normalized = value.toLowerCase();

  if (normalized.endsWith("k")) {
    return Math.round(Number(normalized.replace("k", "")) * 1000);
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function getMockDashboardSummary(): DashboardSummary {
  const lastUpdatedAt = new Date().toISOString();
  const accounts: SocialAccountSummary[] = stats.map((stat) => {
    const overview = overviewStats.filter((item) => item.platform === stat.platform);

    return {
      provider: stat.platform === "twitter" ? "x" : stat.platform,
      username: stat.username,
      displayName: stat.username,
      followers: stat.label === "Followers" ? parseCompactNumber(stat.value) : null,
      subscribers: stat.label === "Subscribers" ? parseCompactNumber(stat.value) : null,
      totalViews:
        parseCompactNumber(
          overview.find((item) => item.label === "Total Views")?.value ?? "",
        ) ?? null,
      postsCount: null,
      today: {
        views:
          parseCompactNumber(
            overview.find((item) => item.label.includes("Views"))?.value ?? "",
          ) ?? null,
        likes:
          parseCompactNumber(
            overview.find((item) => item.label === "Likes")?.value ?? "",
          ) ?? null,
        profileViews:
          parseCompactNumber(
            overview.find((item) => item.label === "Profile Views")?.value ?? "",
          ) ?? null,
      },
      trend: {
        value: parseCompactNumber(stat.trend.split(" ")[0]),
        direction: stat.trendDirection,
      },
      lastUpdatedAt,
      source: "mock",
    };
  });

  return {
    accounts,
    totalFollowers: accounts.reduce(
      (sum, account) => sum + (account.followers ?? account.subscribers ?? 0),
      0,
    ),
    lastUpdatedAt,
    source: "mock",
  };
}
