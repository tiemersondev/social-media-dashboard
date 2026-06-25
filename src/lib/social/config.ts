import "server-only";

import type { OAuthProvider } from "./types";

export const SOCIAL_REVALIDATE_SECONDS = 300;
export const TOKEN_EXPIRY_SAFETY_WINDOW_MS = 5 * 60 * 1000;
export const SOCIAL_SYNC_RATE_LIMIT_MS = 60 * 1000;

export type SocialDataMode = "mock" | "api";

export function getSocialDataMode(): SocialDataMode {
  return process.env.SOCIAL_DATA_MODE === "api" ? "api" : "mock";
}

export function getAppBaseUrl() {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export function getMetaGraphVersion() {
  return process.env.META_GRAPH_API_VERSION ?? "v22.0";
}

export function isSocialAuthDebugEnabled() {
  return process.env.SOCIAL_AUTH_DEBUG === "true";
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function requireTokenEncryptionKey() {
  if (getSocialDataMode() !== "api") {
    return;
  }

  const key = process.env.TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is required when SOCIAL_DATA_MODE=api.",
    );
  }

  if (key.length < 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be at least 32 characters long when SOCIAL_DATA_MODE=api.",
    );
  }
}

export function getOAuthConfig(provider: OAuthProvider) {
  if (provider === "meta") {
    return {
      clientId: process.env.META_CLIENT_ID,
      clientSecret: process.env.META_CLIENT_SECRET,
      redirectUri:
        process.env.META_REDIRECT_URI ??
        `${getAppBaseUrl()}/api/auth/social/meta/callback`,
    };
  }

  if (provider === "x") {
    return {
      clientId: process.env.X_CLIENT_ID,
      clientSecret: process.env.X_CLIENT_SECRET,
      redirectUri:
        process.env.X_REDIRECT_URI ??
        `${getAppBaseUrl()}/api/auth/social/x/callback`,
    };
  }

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ??
      `${getAppBaseUrl()}/api/auth/social/youtube/callback`,
  };
}

export function requireOAuthConfig(provider: OAuthProvider) {
  const config = getOAuthConfig(provider);
  const missing = [
    ["clientId", config.clientId],
    ["clientSecret", config.clientSecret],
    ["redirectUri", config.redirectUri],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `OAuth credentials are not configured for ${provider}. Missing: ${missing.join(
        ", ",
      )}.`,
    );
  }

  return config as {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}
