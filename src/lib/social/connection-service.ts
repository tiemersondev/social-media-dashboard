import "server-only";

import type { SocialConnection, SocialProvider } from "./types";
import { socialTokenStore } from "./token-store";

export const SOCIAL_PROVIDERS: SocialProvider[] = [
  "facebook",
  "instagram",
  "x",
  "youtube",
];

export async function getSocialConnections(): Promise<SocialConnection[]> {
  const tokens = await socialTokenStore.list();

  return SOCIAL_PROVIDERS.map((provider) => {
    const token = tokens.find((item) => item.provider === provider);

    if (!token) {
      return { provider, status: "disconnected" };
    }

    const isExpiredByDate = token.expiresAt
      ? new Date(token.expiresAt).getTime() <= Date.now()
      : false;
    const status = isExpiredByDate ? "expired" : token.status ?? "connected";

    return {
      provider,
      status,
      accountId: token.accountId,
      username: token.username,
      displayName: token.displayName,
      profileUrl: token.profileUrl,
      scopes: token.scopes,
      expiresAt: token.expiresAt,
      lastSyncedAt: token.lastSyncedAt ?? token.updatedAt,
      errorMessage: token.errorMessage,
    };
  });
}

export async function disconnectSocialProvider(provider: SocialProvider) {
  await socialTokenStore.delete(provider);
}

export function isSocialProvider(provider: string): provider is SocialProvider {
  return SOCIAL_PROVIDERS.includes(provider as SocialProvider);
}
