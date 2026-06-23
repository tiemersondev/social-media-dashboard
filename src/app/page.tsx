import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { overviewStats, stats } from "@/data/dashboard";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-dashboard-bg pb-11 text-dashboard-text">
      <div className="absolute inset-x-0 top-0 h-[235px] rounded-b-[22px] bg-dashboard-top md:h-[244px]" />

      <div className="relative mx-auto w-full max-w-[1110px] px-6 md:px-8 xl:px-0">
        <DashboardHeader />

        <section
          aria-label="Follower totals"
          className="relative z-10 mt-10 grid gap-6 md:mt-12 md:grid-cols-2 md:gap-[30px] lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <StatCard key={stat.platform} stat={stat} />
          ))}
        </section>

        <section className="relative z-10 mt-[46px] md:mt-12">
          <h2 className="text-2xl font-bold leading-none tracking-normal">
            Overview - Today
          </h2>

          <div className="mt-7 grid gap-4 md:grid-cols-2 md:gap-[30px] lg:grid-cols-4">
            {overviewStats.map((stat) => (
              <OverviewCard
                key={`${stat.platform}-${stat.label}-${stat.value}`}
                stat={stat}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
