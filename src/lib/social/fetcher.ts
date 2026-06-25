import "server-only";

import { SOCIAL_REVALIDATE_SECONDS } from "./config";

export async function socialFetch<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    next: { revalidate: SOCIAL_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Social API request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}
