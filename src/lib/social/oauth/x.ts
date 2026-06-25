import "server-only";

import { getOAuthConfig, requireOAuthConfig } from "../config";

const X_SCOPES = ["users.read", "tweet.read", "offline.access"];

export type XTokenResponse = {
  token_type?: string;
  expires_in?: number;
  access_token: string;
  refresh_token?: string;
  scope?: string;
};

export type XAccount = {
  id: string;
  username: string;
  name: string;
};

export function buildXAuthorizationUrl(state: string, codeChallenge: string) {
  const { clientId, redirectUri } = requireOAuthConfig("x");
  const url = new URL("https://twitter.com/i/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", X_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url;
}

export async function exchangeXCodeForToken(code: string, codeVerifier: string) {
  const { clientId, clientSecret, redirectUri } = requireOAuthConfig("x");
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64",
      )}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`X token exchange failed with ${response.status}.`);
  }

  return (await response.json()) as XTokenResponse;
}

export async function getXAuthenticatedUser(accessToken: string) {
  const response = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`X account lookup failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { data: XAccount };
  return payload.data;
}

export function getXScopes() {
  return getOAuthConfig("x").clientId ? X_SCOPES : [];
}
