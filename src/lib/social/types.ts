export type SocialProvider = "facebook" | "instagram" | "x" | "youtube";

export type OAuthProvider = "meta" | "x" | "youtube";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "expired"
  | "missing_scope"
  | "error";

export type SocialSyncStatus =
  | "success"
  | "partial"
  | "expired"
  | "missing_scope"
  | "rate_limited"
  | "error";

export type SocialConnection = {
  provider: SocialProvider;
  status: ConnectionStatus;
  accountId?: string;
  username?: string;
  displayName?: string;
  profileUrl?: string;
  scopes?: string[];
  expiresAt?: string | null;
  lastSyncedAt?: string | null;
  errorMessage?: string | null;
};

export type MetricTrend = {
  value: number | null;
  direction: "up" | "down" | "neutral" | "unavailable";
};

export type SocialAccountSummary = {
  provider: SocialProvider;
  username: string;
  displayName?: string;
  profileUrl?: string;
  followers: number | null;
  following?: number | null;
  subscribers?: number | null;
  totalViews?: number | null;
  postsCount?: number | null;
  today?: {
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
    impressions?: number | null;
    profileViews?: number | null;
  };
  trend?: MetricTrend;
  lastUpdatedAt: string;
  source: "api" | "mock" | "fallback";
  status?: SocialSyncStatus;
  errorMessage?: string | null;
};

export type DashboardSummary = {
  accounts: SocialAccountSummary[];
  totalFollowers: number;
  lastUpdatedAt: string;
  source: "api" | "mock" | "mixed";
  hasConnections?: boolean;
  providerStatuses?: Partial<Record<SocialProvider, SocialSyncStatus>>;
};
