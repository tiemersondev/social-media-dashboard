import { NextResponse } from "next/server";
import { requireTokenEncryptionKey } from "@/lib/social/config";
import { syncSocialProviders } from "@/lib/social/dashboard-service";
import { logOAuthDebug } from "@/lib/social/oauth/debug";
import { encryptToken } from "@/lib/social/token-crypto";
import { socialTokenStore, type StoredSocialToken } from "@/lib/social/token-store";
import { clearOAuthCookies, getPkceVerifier, validateOAuthState } from "@/lib/social/oauth/state";
import {
  exchangeMetaCodeForToken,
  getMetaPages,
  getMetaScopes,
} from "@/lib/social/oauth/meta";
import {
  exchangeXCodeForToken,
  getXAuthenticatedUser,
  getXScopes,
} from "@/lib/social/oauth/x";
import {
  exchangeYouTubeCodeForToken,
  getYouTubeChannel,
  getYouTubeScopes,
} from "@/lib/social/oauth/youtube";
import type { OAuthProvider, SocialProvider } from "@/lib/social/types";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

function isOAuthProvider(provider: string): provider is OAuthProvider {
  return provider === "meta" || provider === "x" || provider === "youtube";
}

function redirectToConnections(request: Request, params: Record<string, string>) {
  const url = new URL("/connections", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

function getOAuthErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("state")) {
    return "state";
  }

  if (message.includes("code")) {
    return "code";
  }

  if (message.includes("credential") || message.includes("encryption")) {
    return "config";
  }

  if (message.includes("token exchange")) {
    return "token";
  }

  if (message.includes("permission") || message.includes("scope")) {
    return "permission";
  }

  return "callback";
}

function expiresAtFromSeconds(seconds?: number) {
  if (!seconds) {
    return null;
  }

  return new Date(Date.now() + seconds * 1000).toISOString();
}

function createStoredToken(input: {
  provider: SocialProvider;
  accountId?: string;
  username?: string;
  displayName?: string;
  profileUrl?: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  scopes?: string[];
  expiresAt?: string | null;
}): StoredSocialToken {
  const now = new Date().toISOString();

  return {
    provider: input.provider,
    accountId: input.accountId,
    username: input.username,
    displayName: input.displayName,
    profileUrl: input.profileUrl,
    accessTokenEncrypted: encryptToken(input.accessToken),
    refreshTokenEncrypted: input.refreshToken
      ? encryptToken(input.refreshToken)
      : null,
    tokenType: input.tokenType,
    scopes: input.scopes,
    expiresAt: input.expiresAt ?? null,
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: null,
    status: "connected",
    errorMessage: null,
  };
}

async function handleMetaCallback(code: string) {
  const token = await exchangeMetaCodeForToken(code);
  logOAuthDebug("meta", "callback", { tokenExchange: "success" });
  const pages = await getMetaPages(token.access_token);
  logOAuthDebug("meta", "callback", { pagesFound: pages.length });
  const firstPage = pages[0];
  const expiresAt = expiresAtFromSeconds(token.expires_in);

  if (firstPage) {
    await socialTokenStore.save(
      createStoredToken({
        provider: "facebook",
        accountId: firstPage.id,
        username: firstPage.name,
        displayName: firstPage.name,
        accessToken: firstPage.access_token ?? token.access_token,
        tokenType: token.token_type,
        scopes: getMetaScopes(),
        expiresAt,
      }),
    );
    await syncSocialProviders({ provider: "facebook", force: true });
  }

  const instagramPage = pages.find((page) => page.instagram_business_account);
  const instagram = instagramPage?.instagram_business_account;
  logOAuthDebug("meta", "callback", {
    instagramBusinessAccountFound: Boolean(instagram),
  });

  if (instagram && instagramPage?.access_token) {
    await socialTokenStore.save(
      createStoredToken({
        provider: "instagram",
        accountId: instagram.id,
        username: instagram.username ? `@${instagram.username}` : undefined,
        displayName: instagram.username,
        accessToken: instagramPage.access_token,
        tokenType: token.token_type,
        scopes: getMetaScopes(),
        expiresAt,
      }),
    );
    await syncSocialProviders({ provider: "instagram", force: true });
  }
}

async function handleXCallback(code: string) {
  const verifier = await getPkceVerifier("x");

  if (!verifier) {
    throw new Error("Missing X PKCE verifier.");
  }

  const token = await exchangeXCodeForToken(code, verifier);
  logOAuthDebug("x", "callback", { tokenExchange: "success" });
  const account = await getXAuthenticatedUser(token.access_token);
  logOAuthDebug("x", "callback", { userLoaded: Boolean(account) });

  await socialTokenStore.save(
    createStoredToken({
      provider: "x",
      accountId: account.id,
      username: `@${account.username}`,
      displayName: account.name,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type,
      scopes: token.scope?.split(" ") ?? getXScopes(),
      expiresAt: expiresAtFromSeconds(token.expires_in),
    }),
  );
  await syncSocialProviders({ provider: "x", force: true });
}

async function handleYouTubeCallback(code: string) {
  const token = await exchangeYouTubeCodeForToken(code);
  logOAuthDebug("youtube", "callback", { tokenExchange: "success" });
  const channel = await getYouTubeChannel(token.access_token);
  logOAuthDebug("youtube", "callback", { channelLoaded: Boolean(channel) });

  await socialTokenStore.save(
    createStoredToken({
      provider: "youtube",
      accountId: channel?.id,
      username: channel?.snippet?.customUrl ?? channel?.snippet?.title,
      displayName: channel?.snippet?.title,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type,
      scopes: token.scope?.split(" ") ?? getYouTubeScopes(),
      expiresAt: expiresAtFromSeconds(token.expires_in),
    }),
  );
  await syncSocialProviders({ provider: "youtube", force: true });
}

export async function GET(request: Request, context: RouteContext) {
  const { provider } = await context.params;
  const requestUrl = new URL(request.url);

  if (!isOAuthProvider(provider)) {
    return redirectToConnections(request, { error: "provider" });
  }

  try {
    requireTokenEncryptionKey();
    const code = requestUrl.searchParams.get("code");
    logOAuthDebug(provider, "callback", { receivedCode: Boolean(code) });
    await validateOAuthState(provider, requestUrl.searchParams.get("state"));
    logOAuthDebug(provider, "callback", { stateValid: true });

    if (!code) {
      throw new Error("Missing OAuth code.");
    }

    if (provider === "meta") {
      await handleMetaCallback(code);
    } else if (provider === "x") {
      await handleXCallback(code);
    } else {
      await handleYouTubeCallback(code);
    }

    await clearOAuthCookies(provider);
    return redirectToConnections(request, { connected: provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth callback failed.";
    console.error(`[social:oauth:callback:${provider}] ${message}`);
    await clearOAuthCookies(provider);
    return redirectToConnections(request, {
      error: getOAuthErrorCode(error),
      provider,
    });
  }
}
