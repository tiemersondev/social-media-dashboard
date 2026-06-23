"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const storedTheme = window.localStorage.getItem("theme");
    return (
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  function toggleTheme() {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
  }

  return (
    <button
      type="button"
      aria-pressed={isDark}
      onClick={toggleTheme}
      className="group flex w-full items-center justify-between gap-4 md:w-auto md:justify-end"
    >
      <span className="text-sm font-bold text-dashboard-muted transition-colors group-hover:text-dashboard-text">
        Dark Mode
      </span>
      <span
        className={
          isDark
            ? "relative h-6 w-12 rounded-full bg-toggle-gradient transition-opacity group-hover:opacity-90"
            : "relative h-6 w-12 rounded-full bg-toggle-light transition-opacity group-hover:bg-toggle-gradient"
        }
      >
        <span
          className={
            isDark
              ? "absolute left-1 top-1 h-4 w-4 rounded-full bg-dashboard-top transition-transform"
              : "absolute left-7 top-1 h-4 w-4 rounded-full bg-dashboard-top transition-transform"
          }
        />
      </span>
    </button>
  );
}
