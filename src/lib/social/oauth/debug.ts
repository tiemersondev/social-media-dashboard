import "server-only";

import { isSocialAuthDebugEnabled } from "../config";

type DebugValue = string | number | boolean | null | undefined;

export function logOAuthDebug(
  provider: string,
  step: string,
  details: Record<string, DebugValue> = {},
) {
  if (!isSocialAuthDebugEnabled()) {
    return;
  }

  const suffix = Object.entries(details)
    .map(([key, value]) => `${key}=${value ?? "n/a"}`)
    .join(" ");

  console.log(
    `[${provider}:${step}]${suffix ? ` ${suffix}` : ""}`,
  );
}

