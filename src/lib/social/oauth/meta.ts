import "server-only";

import { getMetaGraphVersion, requireOAuthConfig } from "../config";

const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "read_insights",
  "instagram_basic",
  "instagram_manage_insights",
  "business_management",
];

export type MetaTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type MetaPage = {
  id: string;
  name: string;
  access_token?: string;
  instagram_business_account?: {
    id: string;
    username?: string;
  };
};

export function buildMetaAuthorizationUrl(state: string) {
  const { clientId, redirectUri } = requireOAuthConfig("meta");
  const url = new URL(
    `https://www.facebook.com/${getMetaGraphVersion()}/dialog/oauth`,
  );
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", META_SCOPES.join(","));
  return url;
}

export async function exchangeMetaCodeForToken(code: string) {
  const { clientId, clientSecret, redirectUri } = requireOAuthConfig("meta");
  const url = new URL(
    `https://graph.facebook.com/${getMetaGraphVersion()}/oauth/access_token`,
  );
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Meta token exchange failed with ${response.status}.`);
  }

  return (await response.json()) as MetaTokenResponse;
}

export async function getMetaPages(accessToken: string) {
  const url = new URL(`https://graph.facebook.com/${getMetaGraphVersion()}/me/accounts`);
  url.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username}",
  );
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Meta pages lookup failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { data?: MetaPage[] };
  return payload.data ?? [];
}

export function getMetaScopes() {
  return META_SCOPES;
}
