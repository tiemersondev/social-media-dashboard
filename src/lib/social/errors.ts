import type { SocialProvider } from "./types";

export type SocialProviderError = {
  provider: SocialProvider;
  message: string;
  status?: number;
  recoverable: boolean;
  reason?:
    | "unauthorized"
    | "expired_token"
    | "missing_scope"
    | "rate_limited"
    | "not_connected"
    | "api_error"
    | "unknown";
};

export class SocialApiError extends Error {
  readonly details: SocialProviderError;

  constructor(details: SocialProviderError) {
    super(details.message);
    this.name = "SocialApiError";
    this.details = details;
  }
}

export function logSocialError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  const timestamp = new Date().toISOString();
  console.error(`[social:${context}] ${timestamp} ${message}`);
}
