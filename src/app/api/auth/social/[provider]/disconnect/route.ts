import { NextResponse } from "next/server";
import {
  disconnectSocialProvider,
  isSocialProvider,
} from "@/lib/social/connection-service";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { provider } = await context.params;

  if (!isSocialProvider(provider)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await disconnectSocialProvider(provider);
  return NextResponse.json({ ok: true });
}
