import Link from "next/link";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";
import { SocialIcon } from "@/components/dashboard/SocialIcon";
import type { SocialPlatform } from "@/data/dashboard";
import { getSocialConnections } from "@/lib/social/connection-service";
import type { ConnectionStatus, SocialProvider } from "@/lib/social/types";

const providers: Array<{
  provider: SocialProvider;
  title: string;
  description: string;
}> = [
  {
    provider: "facebook",
    title: "Facebook",
    description: "Conectar Meta Pages",
  },
  {
    provider: "instagram",
    title: "Instagram",
    description: "Conectar conta profissional",
  },
  {
    provider: "x",
    title: "X / Twitter",
    description: "Conectar Twitter API v2",
  },
  {
    provider: "youtube",
    title: "YouTube",
    description: "Conectar canal",
  },
];

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

export async function LoginPage() {
  const connections = await getSocialConnections();
  const connectedCount = connections.filter(
    (connection) => connection.status === "connected",
  ).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard-bg pb-11 text-dashboard-text">
      <div className="absolute inset-x-0 top-0 h-[235px] rounded-b-[22px] bg-dashboard-top md:h-[244px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1110px] flex-col px-6 md:px-8 xl:px-0">
        <header className="relative z-10 flex items-center justify-between pt-9">
          <Link
            href="/dashboard"
            className="text-xl font-bold leading-none text-dashboard-text md:text-2xl"
          >
            Social Media Dashboard
          </Link>
          <ThemeToggle />
        </header>

        <section className="relative z-10 grid flex-1 items-center gap-8 py-12 md:grid-cols-[0.9fr_1.1fr] md:py-16">
          <div>
            <p className="text-sm font-bold text-dashboard-muted">
              Autenticacao social
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.05] tracking-normal md:text-[56px]">
              Conecte suas redes antes de abrir a dashboard
            </h1>
            <p className="mt-5 max-w-[34rem] text-base font-bold leading-7 text-dashboard-muted">
              Autorize Facebook, Instagram, X/Twitter ou YouTube para alimentar
              os cards com dados reais das APIs oficiais.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-[5px] bg-dashboard-text px-5 py-3 text-sm font-bold text-dashboard-bg transition-opacity hover:opacity-80"
              >
                Abrir dashboard
              </Link>
              <Link
                href="/connections"
                className="rounded-[5px] border border-dashboard-divider px-5 py-3 text-sm font-bold text-dashboard-text transition-colors hover:bg-dashboard-card"
              >
                Gerenciar conexoes
              </Link>
            </div>

            <p className="mt-4 text-sm font-bold text-dashboard-muted">
              {connectedCount > 0
                ? `${connectedCount} rede(s) conectada(s)`
                : "Nenhuma rede conectada ainda"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {providers.map((item) => {
              const connection = connections.find(
                (current) => current.provider === item.provider,
              );
              const status = connection?.status ?? "disconnected";
              const isConnected = status === "connected";

              return (
                <article
                  key={item.provider}
                  className="rounded-[5px] bg-dashboard-card p-5 transition-colors hover:bg-dashboard-card-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <SocialIcon
                        platform={toPlatform(item.provider)}
                        className="h-7 w-7"
                      />
                      <div>
                        <h2 className="text-base font-bold">{item.title}</h2>
                        <p className="mt-1 text-sm font-bold text-dashboard-muted">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${statusClass[status]}`}>
                      {statusLabel[status]}
                    </span>
                  </div>

                  <p className="mt-5 min-h-5 text-sm font-bold text-dashboard-muted">
                    {connection?.displayName ?? connection?.username ?? "N/D"}
                  </p>

                  {isConnected ? (
                    <Link
                      href="/dashboard"
                      className="mt-5 inline-flex rounded-[5px] bg-dashboard-text px-4 py-2 text-sm font-bold text-dashboard-bg transition-opacity hover:opacity-80"
                    >
                      Entrar
                    </Link>
                  ) : (
                    <a
                      href={getStartUrl(item.provider)}
                      className="mt-5 inline-flex rounded-[5px] bg-dashboard-text px-4 py-2 text-sm font-bold text-dashboard-bg transition-opacity hover:opacity-80"
                    >
                      {status === "expired" ||
                      status === "error" ||
                      status === "missing_scope"
                        ? "Reconectar"
                        : "Conectar"}
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
