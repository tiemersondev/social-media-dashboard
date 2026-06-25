import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { OAuthProvider } from "../types";

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
}

export async function validateOAuthState(provider: OAuthProvider, state: string | null) {
  const cookieStore = await cookies();
  const cookieName = `${OAUTH_STATE_COOKIE_PREFIX}_${provider}`;
  const storedState = cookieStore.get(cookieName)?.value;

  if (!state || !storedState || state !== storedState) {
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
}

export async function getPkceVerifier(provider: OAuthProvider) {
  const cookieStore = await cookies();
  return cookieStore.get(`${OAUTH_PKCE_COOKIE_PREFIX}_${provider}`)?.value ?? null;
}

export async function clearOAuthCookies(provider: OAuthProvider) {
  const cookieStore = await cookies();
  cookieStore.delete(`${OAUTH_STATE_COOKIE_PREFIX}_${provider}`);
  cookieStore.delete(`${OAUTH_PKCE_COOKIE_PREFIX}_${provider}`);
}
