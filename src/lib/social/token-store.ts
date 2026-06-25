import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasDatabaseUrl } from "./config";
import type {
  ConnectionStatus,
  SocialAccountSummary,
  SocialProvider,
} from "./types";

export type StoredSocialToken = {
  id?: string;
  provider: SocialProvider;
  accountId?: string;
  username?: string;
  displayName?: string;
  profileUrl?: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string | null;
  tokenType?: string;
  scopes?: string[];
  status?: ConnectionStatus;
  errorMessage?: string | null;
  expiresAt?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredMetricSnapshot = {
  id?: string;
  provider: SocialProvider;
  accountId?: string | null;
  data: SocialAccountSummary;
  collectedAt: string;
};

export interface SocialTokenStore {
  get(provider: SocialProvider): Promise<StoredSocialToken | null>;
  save(token: StoredSocialToken): Promise<void>;
  updateToken(provider: SocialProvider, updates: Partial<StoredSocialToken>): Promise<void>;
  markStatus(
    provider: SocialProvider,
    status: ConnectionStatus,
    errorMessage?: string | null,
  ): Promise<void>;
  delete(provider: SocialProvider): Promise<void>;
  list(): Promise<StoredSocialToken[]>;
  saveSnapshot(snapshot: StoredMetricSnapshot): Promise<void>;
  getLatestSnapshot(provider: SocialProvider): Promise<StoredMetricSnapshot | null>;
  deleteSnapshots(provider: SocialProvider): Promise<void>;
}

const tokenStorePath = path.join(process.cwd(), ".social-tokens.json");
const snapshotStorePath = path.join(process.cwd(), ".social-metric-snapshots.json");

function parseScopes(scopes?: string | null) {
  if (!scopes) {
    return undefined;
  }

  return scopes
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function serializeScopes(scopes?: string[]) {
  return scopes?.filter(Boolean).join(" ") || null;
}

function toConnectionStatus(value?: string | null): ConnectionStatus {
  if (
    value === "connected" ||
    value === "expired" ||
    value === "missing_scope" ||
    value === "error"
  ) {
    return value;
  }

  return "connected";
}

function toStoredToken(account: {
  id: string;
  provider: string;
  providerAccountId: string | null;
  username: string | null;
  displayName: string | null;
  profileUrl: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  tokenType: string | null;
  scopes: string | null;
  status: string;
  errorMessage: string | null;
  expiresAt: Date | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): StoredSocialToken {
  return {
    id: account.id,
    provider: account.provider as SocialProvider,
    accountId: account.providerAccountId ?? undefined,
    username: account.username ?? undefined,
    displayName: account.displayName ?? undefined,
    profileUrl: account.profileUrl ?? undefined,
    accessTokenEncrypted: account.accessTokenEncrypted,
    refreshTokenEncrypted: account.refreshTokenEncrypted,
    tokenType: account.tokenType ?? undefined,
    scopes: parseScopes(account.scopes),
    status: toConnectionStatus(account.status),
    errorMessage: account.errorMessage,
    expiresAt: account.expiresAt?.toISOString() ?? null,
    lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

function tokenToPrismaData(token: StoredSocialToken) {
  return {
    provider: token.provider,
    providerAccountId: token.accountId ?? null,
    username: token.username ?? null,
    displayName: token.displayName ?? null,
    profileUrl: token.profileUrl ?? null,
    accessTokenEncrypted: token.accessTokenEncrypted,
    refreshTokenEncrypted: token.refreshTokenEncrypted ?? null,
    tokenType: token.tokenType ?? null,
    scopes: serializeScopes(token.scopes),
    status: token.status ?? "connected",
    errorMessage: token.errorMessage ?? null,
    expiresAt: token.expiresAt ? new Date(token.expiresAt) : null,
    lastSyncedAt: token.lastSyncedAt ? new Date(token.lastSyncedAt) : null,
  };
}

class PrismaSocialTokenStore implements SocialTokenStore {
  async get(provider: SocialProvider) {
    const account = await prisma.socialAccount.findFirst({
      where: { provider },
      orderBy: { updatedAt: "desc" },
    });

    return account ? toStoredToken(account) : null;
  }

  async save(token: StoredSocialToken) {
    const existing = await prisma.socialAccount.findFirst({
      where: { provider: token.provider },
      select: { id: true },
    });
    const data = tokenToPrismaData(token);

    if (existing) {
      await prisma.socialAccount.update({
        where: { id: existing.id },
        data,
      });
      return;
    }

    await prisma.socialAccount.create({ data });
  }

  async updateToken(provider: SocialProvider, updates: Partial<StoredSocialToken>) {
    const existing = await prisma.socialAccount.findFirst({
      where: { provider },
      select: { id: true },
    });

    if (!existing) {
      return;
    }

    const data: Prisma.SocialAccountUpdateInput = {};

    if (updates.accessTokenEncrypted !== undefined) {
      data.accessTokenEncrypted = updates.accessTokenEncrypted;
    }
    if (updates.refreshTokenEncrypted !== undefined) {
      data.refreshTokenEncrypted = updates.refreshTokenEncrypted;
    }
    if (updates.tokenType !== undefined) {
      data.tokenType = updates.tokenType ?? null;
    }
    if (updates.scopes !== undefined) {
      data.scopes = serializeScopes(updates.scopes);
    }
    if (updates.expiresAt !== undefined) {
      data.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    }
    if (updates.lastSyncedAt !== undefined) {
      data.lastSyncedAt = updates.lastSyncedAt
        ? new Date(updates.lastSyncedAt)
        : null;
    }
    if (updates.status !== undefined) {
      data.status = updates.status;
    }
    if (updates.errorMessage !== undefined) {
      data.errorMessage = updates.errorMessage;
    }

    await prisma.socialAccount.update({
      where: { id: existing.id },
      data,
    });
  }

  async markStatus(
    provider: SocialProvider,
    status: ConnectionStatus,
    errorMessage?: string | null,
  ) {
    await this.updateToken(provider, {
      status,
      errorMessage: errorMessage ?? null,
    });
  }

  async delete(provider: SocialProvider) {
    await prisma.socialAccount.deleteMany({ where: { provider } });
    await this.deleteSnapshots(provider);
  }

  async list() {
    const accounts = await prisma.socialAccount.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return accounts.map(toStoredToken);
  }

  async saveSnapshot(snapshot: StoredMetricSnapshot) {
    await prisma.socialMetricSnapshot.create({
      data: {
        provider: snapshot.provider,
        accountId: snapshot.accountId ?? null,
        data: snapshot.data as unknown as Prisma.InputJsonValue,
        collectedAt: new Date(snapshot.collectedAt),
      },
    });
  }

  async getLatestSnapshot(provider: SocialProvider) {
    const snapshot = await prisma.socialMetricSnapshot.findFirst({
      where: { provider },
      orderBy: { collectedAt: "desc" },
    });

    if (!snapshot) {
      return null;
    }

    return {
      id: snapshot.id,
      provider: snapshot.provider as SocialProvider,
      accountId: snapshot.accountId,
      data: snapshot.data as unknown as SocialAccountSummary,
      collectedAt: snapshot.collectedAt.toISOString(),
    };
  }

  async deleteSnapshots(provider: SocialProvider) {
    await prisma.socialMetricSnapshot.deleteMany({ where: { provider } });
  }
}

class LocalFileSocialTokenStore implements SocialTokenStore {
  async get(provider: SocialProvider) {
    const tokens = await this.list();
    return tokens.find((token) => token.provider === provider) ?? null;
  }

  async save(token: StoredSocialToken) {
    const tokens = await this.list();
    const nextTokens = [
      ...tokens.filter((item) => item.provider !== token.provider),
      token,
    ];

    await fs.writeFile(tokenStorePath, JSON.stringify(nextTokens, null, 2));
  }

  async updateToken(provider: SocialProvider, updates: Partial<StoredSocialToken>) {
    const token = await this.get(provider);

    if (!token) {
      return;
    }

    await this.save({
      ...token,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  async markStatus(
    provider: SocialProvider,
    status: ConnectionStatus,
    errorMessage?: string | null,
  ) {
    await this.updateToken(provider, {
      status,
      errorMessage: errorMessage ?? null,
    });
  }

  async delete(provider: SocialProvider) {
    const tokens = await this.list();
    await fs.writeFile(
      tokenStorePath,
      JSON.stringify(
        tokens.filter((token) => token.provider !== provider),
        null,
        2,
      ),
    );
    await this.deleteSnapshots(provider);
  }

  async list() {
    try {
      const file = await fs.readFile(tokenStorePath, "utf8");
      return JSON.parse(file) as StoredSocialToken[];
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }

      throw error;
    }
  }

  async saveSnapshot(snapshot: StoredMetricSnapshot) {
    const snapshots = await this.listSnapshots();
    const nextSnapshots = [
      ...snapshots.filter((item) => item.provider !== snapshot.provider),
      snapshot,
    ];

    await fs.writeFile(snapshotStorePath, JSON.stringify(nextSnapshots, null, 2));
  }

  async getLatestSnapshot(provider: SocialProvider) {
    const snapshots = await this.listSnapshots();

    return (
      snapshots
        .filter((snapshot) => snapshot.provider === provider)
        .sort(
          (a, b) =>
            new Date(b.collectedAt).getTime() -
            new Date(a.collectedAt).getTime(),
        )[0] ?? null
    );
  }

  async deleteSnapshots(provider: SocialProvider) {
    const snapshots = await this.listSnapshots();
    await fs.writeFile(
      snapshotStorePath,
      JSON.stringify(
        snapshots.filter((snapshot) => snapshot.provider !== provider),
        null,
        2,
      ),
    );
  }

  private async listSnapshots() {
    try {
      const file = await fs.readFile(snapshotStorePath, "utf8");
      return JSON.parse(file) as StoredMetricSnapshot[];
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }

      throw error;
    }
  }
}

export const socialTokenStore: SocialTokenStore = hasDatabaseUrl()
  ? new PrismaSocialTokenStore()
  : new LocalFileSocialTokenStore();
