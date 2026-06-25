"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SocialIcon } from "@/components/dashboard/SocialIcon";
import type { SocialPlatform } from "@/data/dashboard";
import type { ConnectionStatus, SocialProvider } from "@/lib/social/types";

type ConnectionCardProps = {
  provider: SocialProvider;
  title: string;
  description: string;
  status: ConnectionStatus;
  username?: string;
  displayName?: string;
  lastSyncedAt?: string | null;
  errorMessage?: string | null;
};

const statusLabel: Record<ConnectionStatus, string> = {
  connected: "Conectado",
  disconnected: "Nao conectado",
  expired: "Expirado",
  missing_scope: "Permissao pendente",
  error: "Erro",
};

const statusClass: Record<ConnectionStatus, string> = {
  connected: "text-lime-dashboard",
  disconnected: "text-dashboard-muted",
  expired: "text-rose-dashboard",
  missing_scope: "text-rose-dashboard",
  error: "text-rose-dashboard",
};

function toPlatform(provider: SocialProvider): SocialPlatform {
  return provider === "x" ? "twitter" : provider;
}

function getStartUrl(provider: SocialProvider) {
  return provider === "facebook" || provider === "instagram"
    ? "/api/auth/social/meta/start"
    : `/api/auth/social/${provider}/start`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ConnectionCard({
  provider,
  title,
  description,
  status,
  username,
  displayName,
  lastSyncedAt,
  errorMessage,
}: ConnectionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isConnected = status === "connected";
  const needsReconnect =
    status === "expired" || status === "error" || status === "missing_scope";

  function disconnect() {
    startTransition(async () => {
      await fetch(`/api/auth/social/${provider}/disconnect`, {
        method: "POST",
      });
      router.refresh();
    });
  }

  function sync() {
    startTransition(async () => {
      await fetch(`/api/social/sync?provider=${provider}`, {
        method: "POST",
      });
      router.refresh();
    });
  }

  return (
    <article className="rounded-[5px] bg-dashboard-card p-5 transition-colors hover:bg-dashboard-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <SocialIcon platform={toPlatform(provider)} className="h-6 w-6 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-dashboard-text">{title}</h2>
            <p className="mt-1 text-sm font-bold text-dashboard-muted">
              {description}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-bold ${statusClass[status]}`}>
          {statusLabel[status]}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div>
          <dt className="font-bold text-dashboard-muted">Conta</dt>
          <dd className="mt-1 text-dashboard-text">
            {displayName ?? username ?? "N/D"}
          </dd>
        </div>
        <div>
          <dt className="font-bold text-dashboard-muted">Ultima sincronizacao</dt>
          <dd className="mt-1 text-dashboard-text">{formatDate(lastSyncedAt)}</dd>
        </div>
        {errorMessage ? (
          <div>
            <dt className="font-bold text-dashboard-muted">Mensagem</dt>
            <dd className="mt-1 text-rose-dashboard">{errorMessage}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {!isConnected ? (
          <a
            href={getStartUrl(provider)}
            className="rounded-[5px] bg-dashboard-text px-4 py-2 text-sm font-bold text-dashboard-bg transition-opacity hover:opacity-80"
          >
            {needsReconnect ? "Reconectar" : "Conectar"}
          </a>
        ) : null}
        {isConnected ? (
          <button
            type="button"
            onClick={sync}
            disabled={isPending}
            className="rounded-[5px] bg-dashboard-text px-4 py-2 text-sm font-bold text-dashboard-bg transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            {isPending ? "Sincronizando" : "Testar conexao"}
          </button>
        ) : null}
        {isConnected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            className="rounded-[5px] border border-dashboard-divider px-4 py-2 text-sm font-bold text-dashboard-text transition-colors hover:bg-dashboard-bg disabled:opacity-60"
          >
            {isPending ? "Desconectando" : "Desconectar"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
