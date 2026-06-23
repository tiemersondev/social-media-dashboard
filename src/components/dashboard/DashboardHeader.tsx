import { ThemeToggle } from "./ThemeToggle";

export function DashboardHeader() {
  return (
    <header className="relative z-10 pt-9 md:flex md:items-start md:justify-between md:pt-9">
      <div className="border-b border-dashboard-divider pb-6 md:border-0 md:pb-0">
        <h1 className="text-2xl font-bold leading-none tracking-normal md:text-[28px]">
          Social Media Dashboard
        </h1>
        <p className="mt-2 text-sm font-bold leading-none text-dashboard-muted">
          Total Followers: 23,004
        </p>
      </div>
      <div className="pt-4 md:pt-[3px]">
        <ThemeToggle />
      </div>
    </header>
  );
}
