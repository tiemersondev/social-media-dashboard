import type { TrendDirection } from "@/data/dashboard";

type TrendProps = {
  direction: TrendDirection;
  children: React.ReactNode;
};

export function Trend({ direction, children }: TrendProps) {
  const isUp = direction === "up";

  return (
    <span
      className={
        isUp
          ? "inline-flex items-center gap-1 text-xs font-bold text-lime-dashboard"
          : "inline-flex items-center gap-1 text-xs font-bold text-rose-dashboard"
      }
    >
      <span
        className={
          isUp
            ? "h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent border-b-lime-dashboard"
            : "h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-rose-dashboard"
        }
      />
      {children}
    </span>
  );
}
