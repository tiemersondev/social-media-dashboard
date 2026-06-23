export type SocialPlatform = "facebook" | "twitter" | "instagram" | "youtube";

export type TrendDirection = "up" | "down";

export type StatCardData = {
  platform: SocialPlatform;
  username: string;
  value: string;
  label: string;
  trend: string;
  trendDirection: TrendDirection;
};

export type OverviewCardData = {
  platform: SocialPlatform;
  label: string;
  value: string;
  trend: string;
  trendDirection: TrendDirection;
};

export const stats: StatCardData[] = [
  {
    platform: "facebook",
    username: "@nathanf",
    value: "1987",
    label: "Followers",
    trend: "12 Today",
    trendDirection: "up",
  },
  {
    platform: "twitter",
    username: "@nathanf",
    value: "1044",
    label: "Followers",
    trend: "99 Today",
    trendDirection: "up",
  },
  {
    platform: "instagram",
    username: "@realnathanf",
    value: "11k",
    label: "Followers",
    trend: "1099 Today",
    trendDirection: "up",
  },
  {
    platform: "youtube",
    username: "Nathan F.",
    value: "8239",
    label: "Subscribers",
    trend: "144 Today",
    trendDirection: "down",
  },
];

export const overviewStats: OverviewCardData[] = [
  {
    platform: "facebook",
    label: "Page Views",
    value: "87",
    trend: "3%",
    trendDirection: "up",
  },
  {
    platform: "facebook",
    label: "Likes",
    value: "52",
    trend: "2%",
    trendDirection: "down",
  },
  {
    platform: "instagram",
    label: "Likes",
    value: "5462",
    trend: "2257%",
    trendDirection: "up",
  },
  {
    platform: "instagram",
    label: "Profile Views",
    value: "52k",
    trend: "1375%",
    trendDirection: "up",
  },
  {
    platform: "twitter",
    label: "Retweets",
    value: "117",
    trend: "303%",
    trendDirection: "up",
  },
  {
    platform: "twitter",
    label: "Likes",
    value: "507",
    trend: "553%",
    trendDirection: "up",
  },
  {
    platform: "youtube",
    label: "Likes",
    value: "107",
    trend: "19%",
    trendDirection: "down",
  },
  {
    platform: "youtube",
    label: "Total Views",
    value: "1407",
    trend: "12%",
    trendDirection: "down",
  },
];
