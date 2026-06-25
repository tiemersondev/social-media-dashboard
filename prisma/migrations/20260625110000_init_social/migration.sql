CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "tokenType" TEXT,
    "scopes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "errorMessage" TEXT,
    "expiresAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialMetricSnapshot" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accountId" TEXT,
    "data" JSONB NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialAccount_provider_providerAccountId_key" ON "SocialAccount"("provider", "providerAccountId");
CREATE INDEX "SocialAccount_provider_idx" ON "SocialAccount"("provider");
CREATE INDEX "SocialAccount_status_idx" ON "SocialAccount"("status");
CREATE INDEX "SocialMetricSnapshot_provider_collectedAt_idx" ON "SocialMetricSnapshot"("provider", "collectedAt");
