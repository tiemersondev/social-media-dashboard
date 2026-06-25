import { NextResponse } from "next/server";
import { isSocialAuthDebugEnabled } from "@/lib/social/config";
import { socialTokenStore } from "@/lib/social/token-store";

export async function GET() {
  if (process.env.NODE_ENV === "production" || !isSocialAuthDebugEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Debug endpoint unavailable." },
      { status: 404 },
    );
  }

  const connections = await socialTokenStore.list();

  return NextResponse.json({
    ok: true,
    connections: connections.map((connection) => ({
      provider: connection.provider,
      status: connection.status ?? "connected",
      accountId: connection.accountId,
      username: connection.username,
      displayName: connection.displayName,
      hasAccessToken: Boolean(connection.accessTokenEncrypted),
      hasRefreshToken: Boolean(connection.refreshTokenEncrypted),
      expiresAt: connection.expiresAt,
      lastSyncedAt: connection.lastSyncedAt,
      updatedAt: connection.updatedAt,
      errorMessage: connection.errorMessage,
    })),
  });
}

