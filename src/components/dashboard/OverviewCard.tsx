import type { OverviewCardData } from "@/data/dashboard";
import { SocialIcon } from "./SocialIcon";
import { Trend } from "./Trend";

type OverviewCardProps = {
  stat: OverviewCardData;
};

export function OverviewCard({ stat }: OverviewCardProps) {
  return (
    <article className="grid min-h-[125px] grid-cols-2 rounded-[5px] bg-dashboard-card px-6 py-[26px] transition-colors hover:bg-dashboard-card-hover md:px-6">
      <h3 className="text-sm font-bold text-dashboard-muted">{stat.label}</h3>
      <div className="justify-self-end">
        <SocialIcon platform={stat.platform} />
      </div>
      <strong className="self-end text-[32px] font-bold leading-none tracking-[-1px] text-dashboard-text">
        {stat.value}
      </strong>
      <div className="self-end justify-self-end pb-1">
        <Trend direction={stat.trendDirection}>{stat.trend}</Trend>
      </div>
    </article>
  );
}
