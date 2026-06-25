import { ConnectionCard } from "./ConnectionCard";
import type { SocialConnection, SocialProvider } from "@/lib/social/types";

type ConnectionsListProps = {
  connections: SocialConnection[];
};

const metadata: Record<
  SocialProvider,
  {
    title: string;
    description: string;
  }
> = {
  facebook: {
    title: "Facebook",
    description: "Meta Pages e Page Insights",
  },
  instagram: {
    title: "Instagram",
    description: "Conta profissional via Meta",
  },
  x: {
    title: "X / Twitter",
    description: "Twitter API v2 com OAuth 2.0",
  },
  youtube: {
    title: "YouTube",
    description: "YouTube Data e Analytics APIs",
  },
};

export function ConnectionsList({ connections }: ConnectionsListProps) {
  return (
    <section className="relative z-10 mt-8 grid gap-4 md:grid-cols-2 md:gap-[30px]">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.provider}
          {...connection}
          title={metadata[connection.provider].title}
          description={metadata[connection.provider].description}
        />
      ))}
    </section>
  );
}
