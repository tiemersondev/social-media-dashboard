import "server-only";

import { requireOAuthConfig, TOKEN_EXPIRY_SAFETY_WINDOW_MS } from "../config";
import { logSocialError } from "../errors";
import { decryptToken, encryptToken } from "../token-crypto";
import { socialTokenStore, type StoredSocialToken } from "../token-store";
import type { SocialProvider } from "../types";

type RefreshResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

function expiresAtFromSeconds(seconds?: number) {
  return seconds ? new Date(Date.now() + seconds * 1000).toISOString() : null;
}

function shouldRefresh(token: StoredSocialToken) {
  if (!token.expiresAt) {
    return false;
  }

  return (
    new Date(token.expiresAt).getTime() - TOKEN_EXPIRY_SAFETY_WINDOW_MS <=
    Date.now()
  );
}

async function refreshXToken(refreshToken: string) {
  const { clientId, clientSecret } = requireOAuthConfig("x");

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64",
      )}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    throw new Error(`X token refresh failed with ${response.status}.`);
  }

  return (await response.json()) as RefreshResponse;
}

async function refreshYouTubeToken(refreshToken: string) {
  const { clientId, clientSecret } = requireOAuthConfig("youtube");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube token refresh failed with ${response.status}.`);
  }

  return (await response.json()) as RefreshResponse;
}

async function refreshToken(provider: SocialProvider, refreshToken: string) {
  if (provider === "x") {
    return refreshXToken(refreshToken);
  }

  if (provider === "youtube") {
    return refreshYouTubeToken(refreshToken);
  }

  return null;
}

export async function ensureFreshAccessToken(token: StoredSocialToken) {
  if (!shouldRefresh(token)) {
    return decryptToken(token.accessTokenEncrypted);
  }

  if (!token.refreshTokenEncrypted) {
    await socialTokenStore.markStatus(
      token.provider,
      "expired",
      "Token expirado. Reconecte a conta.",
    );
    throw new Error(`${token.provider} token expired and has no refresh token.`);
  }

  try {
    const refreshTokenValue = decryptToken(token.refreshTokenEncrypted);
    const refreshed = await refreshToken(token.provider, refreshTokenValue);

    if (!refreshed) {
      return decryptToken(token.accessTokenEncrypted);
    }

    await socialTokenStore.updateToken(token.provider, {
      accessTokenEncrypted: encryptToken(refreshed.access_token),
      refreshTokenEncrypted: refreshed.refresh_token
        ? encryptToken(refreshed.refresh_token)
        : token.refreshTokenEncrypted,
      tokenType: refreshed.token_type ?? token.tokenType,
      scopes: refreshed.scope?.split(" ") ?? token.scopes,
      expiresAt: expiresAtFromSeconds(refreshed.expires_in),
      status: "connected",
      errorMessage: null,
    });

    return refreshed.access_token;
  } catch (error) {
    await socialTokenStore.markStatus(
      token.provider,
      "expired",
      "Nao foi possivel renovar o token. Reconecte a conta.",
    );
    logSocialError(`refresh:${token.provider}`, error);
    throw error;
  }
}
