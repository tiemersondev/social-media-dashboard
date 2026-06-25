import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ConnectionsList } from "@/components/connections/ConnectionsList";
import { getSocialConnections } from "@/lib/social/connection-service";
import { getDashboardSummary } from "@/lib/social/dashboard-service";

export const dynamic = "force-dynamic";

type ConnectionsPageProps = {
  searchParams?: Promise<{
    connected?: string;
    error?: string;
    provider?: string;
    disconnected?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  provider: "Provider invalido para OAuth.",
  config:
    "Configuracao OAuth incompleta. Confira .env.local, APP_BASE_URL, redirects e reinicie o Next.",
  state:
    "State OAuth invalido. Confira se o cookie foi salvo, se Secure esta desligado em localhost HTTP e se o callback usa a mesma porta.",
  code: "A plataforma nao retornou authorization code.",
  token:
    "Falha ao trocar code por token. Confira client secret, redirect URI e permissoes do app na plataforma.",
  permission:
    "Permissao ou escopo insuficiente para carregar a conta. Revise os scopes aprovados na plataforma.",
  callback: "Nao foi possivel concluir o callback OAuth.",
};

export default async function ConnectionsPage({ searchParams }: ConnectionsPageProps) {
  const emptyParams: Awaited<NonNullable<ConnectionsPageProps["searchParams"]>> = {};
  const [connections, summary, params] = await Promise.all([
    getSocialConnections(),
    getDashboardSummary(),
    searchParams ?? Promise.resolve(emptyParams),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard-bg pb-11 text-dashboard-text">
      <div className="absolute inset-x-0 top-0 h-[235px] rounded-b-[22px] bg-dashboard-top md:h-[244px]" />
      <div className="relative mx-auto w-full max-w-[1110px] px-6 md:px-8 xl:px-0">
        <DashboardHeader totalFollowers={summary.totalFollowers} />

        <div className="relative z-10 mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-dashboard-muted">Conexoes</p>
            <h1 className="mt-2 text-2xl font-bold leading-none md:text-[28px]">
              Redes sociais conectadas
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-bold text-dashboard-muted underline transition-colors hover:text-dashboard-text"
          >
            Voltar ao dashboard
          </Link>
        </div>

        {params.connected ? (
          <p className="relative z-10 mt-6 rounded-[5px] bg-dashboard-card p-4 text-sm font-bold text-lime-dashboard">
            Conexao autorizada com sucesso para {params.connected}.
          </p>
        ) : null}

        {params.error ? (
          <p className="relative z-10 mt-6 rounded-[5px] bg-dashboard-card p-4 text-sm font-bold text-rose-dashboard">
            {errorMessages[params.error] ??
              "Nao foi possivel concluir a conexao. Verifique as credenciais e permissoes do provider."}
            {params.provider ? ` Provider: ${params.provider}.` : ""}
          </p>
        ) : null}

        <ConnectionsList connections={connections} />
      </div>
    </main>
  );
}
