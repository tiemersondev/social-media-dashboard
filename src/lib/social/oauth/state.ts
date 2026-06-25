import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { OAuthProvider } from "../types";
import { logOAuthDebug } from "./debug";

export const OAUTH_STATE_COOKIE_PREFIX = "social_oauth_state";
export const OAUTH_PKCE_COOKIE_PREFIX = "social_oauth_pkce";

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  };
}

export function createOAuthState() {
  return crypto.randomBytes(24).toString("base64url");
}

export async function saveOAuthState(provider: OAuthProvider, state: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    `${OAUTH_STATE_COOKIE_PREFIX}_${provider}`,
    state,
    getCookieOptions(),
  );
  logOAuthDebug("oauth", "state", {
    provider,
    saved: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function validateOAuthState(provider: OAuthProvider, state: string | null) {
  const cookieStore = await cookies();
  const cookieName = `${OAUTH_STATE_COOKIE_PREFIX}_${provider}`;
  const storedState = cookieStore.get(cookieName)?.value;
  const stateMatches = Boolean(state && storedState && state === storedState);

  logOAuthDebug("oauth", "state", {
    provider,
    cookieExists: Boolean(storedState),
    queryStateExists: Boolean(state),
    stateMatches,
  });

  if (!stateMatches) {
    throw new Error("Invalid OAuth state.");
  }
}

export async function savePkceVerifier(provider: OAuthProvider, verifier: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    `${OAUTH_PKCE_COOKIE_PREFIX}_${provider}`,
    verifier,
    getCookieOptions(),
  );
  logOAuthDebug(provider, "start", { pkceGenerated: true });
}

export async function getPkceVerifier(provider: OAuthProvider) {
  const cookieStore = await cookies();
  const verifier =
    cookieStore.get(`${OAUTH_PKCE_COOKIE_PREFIX}_${provider}`)?.value ?? null;
  logOAuthDebug(provider, "callback", { codeVerifierFound: Boolean(verifier) });
  return verifier;
}

export async function clearOAuthCookies(provider: OAuthProvider) {
  const cookieStore = await cookies();
  cookieStore.delete(`${OAUTH_STATE_COOKIE_PREFIX}_${provider}`);
  cookieStore.delete(`${OAUTH_PKCE_COOKIE_PREFIX}_${provider}`);
}
