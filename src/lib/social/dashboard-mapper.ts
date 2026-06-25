import type { OverviewCardData, StatCardData } from "@/data/dashboard";
import type { DashboardSummary, SocialAccountSummary } from "./types";

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }

  if (value >= 10000) {
    return `${Math.round(value / 1000)}k`;
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function mapProvider(provider: SocialAccountSummary["provider"]): StatCardData["platform"] {
  return provider === "x" ? "twitter" : provider;
}

function formatTrend(account: SocialAccountSummary) {
  if (!account.trend || account.trend.direction === "unavailable") {
    return { trend: "--", trendDirection: "up" as const };
  }

  return {
    trend: `${formatNumber(account.trend.value)} Today`,
    trendDirection:
      account.trend.direction === "down" ? ("down" as const) : ("up" as const),
  };
}

export function mapDashboardSummaryToCards(summary: DashboardSummary) {
  const stats: StatCardData[] = summary.accounts.map((account) => {
    const metric = account.subscribers ?? account.followers;
    const trend = formatTrend(account);

    return {
      platform: mapProvider(account.provider),
      username: account.username,
      value: formatNumber(metric),
      label: account.provider === "youtube" ? "Subscribers" : "Followers",
      ...trend,
    };
  });

  const overviewStats: OverviewCardData[] = summary.accounts.flatMap((account) => {
    const platform = mapProvider(account.provider);
    const trend = formatTrend(account);

    return [
      {
        platform,
        label: account.provider === "youtube" ? "Total Views" : "Page Views",
        value: formatNumber(account.totalViews ?? account.today?.views),
        trend: trend.trend === "--" ? "--" : trend.trend.replace(" Today", "%"),
        trendDirection: trend.trendDirection,
      },
      {
        platform,
        label: account.provider === "instagram" ? "Profile Views" : "Likes",
        value: formatNumber(account.today?.profileViews ?? account.today?.likes),
        trend: trend.trend === "--" ? "--" : trend.trend.replace(" Today", "%"),
        trendDirection: trend.trendDirection,
      },
    ];
  });

  return { stats, overviewStats };
}
