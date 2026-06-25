import { NextResponse } from "next/server";
import {
  requireOAuthConfig,
  requireTokenEncryptionKey,
} from "@/lib/social/config";
import { logOAuthDebug } from "@/lib/social/oauth/debug";
import { createPkcePair } from "@/lib/social/oauth/pkce";
import {
  createOAuthState,
  saveOAuthState,
  savePkceVerifier,
} from "@/lib/social/oauth/state";
import { buildMetaAuthorizationUrl, getMetaScopes } from "@/lib/social/oauth/meta";
import { buildXAuthorizationUrl, getXScopes } from "@/lib/social/oauth/x";
import {
  buildYouTubeAuthorizationUrl,
  getYouTubeScopes,
} from "@/lib/social/oauth/youtube";
import type { OAuthProvider } from "@/lib/social/types";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

function isOAuthProvider(provider: string): provider is OAuthProvider {
  return provider === "meta" || provider === "x" || provider === "youtube";
}

function getScopes(provider: OAuthProvider) {
  if (provider === "meta") {
    return getMetaScopes();
  }

  if (provider === "x") {
    return getXScopes();
  }

  return getYouTubeScopes();
}

function redirectToConnections(request: Request, params: Record<string, string>) {
  const url = new URL("/connections", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

export async function GET(_request: Request, context: RouteContext) {
  const { provider } = await context.params;

  if (!isOAuthProvider(provider)) {
    return redirectToConnections(_request, { error: "provider" });
  }

  try {
    requireTokenEncryptionKey();
    const oauthConfig = requireOAuthConfig(provider);
    const state = createOAuthState();
    await saveOAuthState(provider, state);

    logOAuthDebug(provider, "start", {
      redirectUri: oauthConfig.redirectUri,
      scopes: getScopes(provider).join(" "),
    });

    if (provider === "x") {
      const pkce = createPkcePair();
      await savePkceVerifier(provider, pkce.verifier);
      const authorizationUrl = buildXAuthorizationUrl(state, pkce.challenge);
      logOAuthDebug("x", "start", { redirectingToXOAuth: true });
      return NextResponse.redirect(authorizationUrl);
    }

    if (provider === "meta") {
      const authorizationUrl = buildMetaAuthorizationUrl(state);
      logOAuthDebug("meta", "start", { redirectingToMetaOAuth: true });
      return NextResponse.redirect(authorizationUrl);
    }

    const authorizationUrl = buildYouTubeAuthorizationUrl(state);
    logOAuthDebug("youtube", "start", { redirectingToGoogleOAuth: true });
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth start failed.";
    console.error(`[social:oauth:start:${provider}] ${message}`);
    return redirectToConnections(_request, {
      error: "config",
      provider,
    });
  }
}
