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
    disconnected?: string;
  }>;
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
            Conexao autorizada com sucesso.
          </p>
        ) : null}

        {params.error ? (
          <p className="relative z-10 mt-6 rounded-[5px] bg-dashboard-card p-4 text-sm font-bold text-rose-dashboard">
            Nao foi possivel concluir a conexao. Verifique as credenciais e
            permissoes do provider.
          </p>
        ) : null}

        <ConnectionsList connections={connections} />
      </div>
    </main>
  );
}
