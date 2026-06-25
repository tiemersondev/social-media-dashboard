import { NextResponse } from "next/server";
import { createPkcePair } from "@/lib/social/oauth/pkce";
import {
  createOAuthState,
  saveOAuthState,
  savePkceVerifier,
} from "@/lib/social/oauth/state";
import { buildMetaAuthorizationUrl } from "@/lib/social/oauth/meta";
import { buildXAuthorizationUrl } from "@/lib/social/oauth/x";
import { buildYouTubeAuthorizationUrl } from "@/lib/social/oauth/youtube";
import type { OAuthProvider } from "@/lib/social/types";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

function isOAuthProvider(provider: string): provider is OAuthProvider {
  return provider === "meta" || provider === "x" || provider === "youtube";
}

export async function GET(_request: Request, context: RouteContext) {
  const { provider } = await context.params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL("/connections?error=provider", _request.url));
  }

  try {
    const state = createOAuthState();
    await saveOAuthState(provider, state);

    if (provider === "x") {
      const pkce = createPkcePair();
      await savePkceVerifier(provider, pkce.verifier);
      return NextResponse.redirect(buildXAuthorizationUrl(state, pkce.challenge));
    }

    if (provider === "meta") {
      return NextResponse.redirect(buildMetaAuthorizationUrl(state));
    }

    return NextResponse.redirect(buildYouTubeAuthorizationUrl(state));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth start failed.";
    console.error(`[social:oauth:start:${provider}] ${message}`);
    return NextResponse.redirect(new URL(`/connections?error=${provider}`, _request.url));
  }
}
