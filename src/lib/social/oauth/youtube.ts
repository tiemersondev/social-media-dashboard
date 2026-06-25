import "server-only";

import { requireOAuthConfig } from "../config";

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export type YouTubeChannel = {
  id: string;
  snippet?: {
    title?: string;
    customUrl?: string;
  };
  statistics?: {
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
    hiddenSubscriberCount?: boolean;
  };
};

export function buildYouTubeAuthorizationUrl(state: string) {
  const { clientId, redirectUri } = requireOAuthConfig("youtube");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_SCOPES.join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url;
}

export async function exchangeYouTubeCodeForToken(code: string) {
  const { clientId, clientSecret, redirectUri } = requireOAuthConfig("youtube");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`YouTube token exchange failed with ${response.status}.`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function getYouTubeChannel(accessToken: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("mine", "true");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`YouTube channel lookup failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { items?: YouTubeChannel[] };
  return payload.items?.[0] ?? null;
}

export function getYouTubeScopes() {
  return YOUTUBE_SCOPES;
}
