import type { StatCardData } from "@/data/dashboard";
import { SocialIcon } from "./SocialIcon";
import { Trend } from "./Trend";

type StatCardProps = {
  stat: StatCardData;
};

const topBarClass: Record<StatCardData["platform"], string> = {
  facebook: "bg-social-facebook",
  twitter: "bg-social-twitter",
  instagram: "bg-instagram-gradient",
  youtube: "bg-social-youtube",
};

export function StatCard({ stat }: StatCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[5px] bg-dashboard-card px-4 pb-6 pt-8 text-center transition-colors hover:bg-dashboard-card-hover md:pb-6 md:pt-8">
      <div className={`absolute inset-x-0 top-0 h-1 ${topBarClass[stat.platform]}`} />
      <div className="flex items-center justify-center gap-2">
        <SocialIcon platform={stat.platform} />
        <span className="text-xs font-bold text-dashboard-muted">
          {stat.username}
        </span>
      </div>
      <strong className="mt-7 block text-[56px] font-bold leading-[0.85] tracking-[-2px] text-dashboard-text">
        {stat.value}
      </strong>
      <p className="mt-3 text-xs uppercase tracking-[0.42em] text-dashboard-muted">
        {stat.label}
      </p>
      <div className="mt-6">
        <Trend direction={stat.trendDirection}>{stat.trend}</Trend>
      </div>
    </article>
  );
}
