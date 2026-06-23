import type { SocialPlatform } from "@/data/dashboard";

type SocialIconProps = {
  platform: SocialPlatform;
  className?: string;
};

export function SocialIcon({ platform, className = "h-5 w-5" }: SocialIconProps) {
  if (platform === "facebook") {
    return (
      <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
        <rect width="20" height="20" rx="2" fill="hsl(208, 92%, 53%)" />
        <path
          d="M12.9 6.5h-1.5c-.5 0-.7.3-.7.8v1.3h2.1l-.3 2.1h-1.8V16H8.5v-5.3H6.8V8.6h1.7V7.1c0-1.8 1.1-2.9 2.8-2.9.8 0 1.5.1 1.6.1v2.2Z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (platform === "twitter") {
    return (
      <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M18 5.7c-.6.3-1.2.5-1.9.6.7-.4 1.2-1 1.4-1.8-.6.4-1.3.7-2.1.8a3.2 3.2 0 0 0-5.6 2.2c0 .2 0 .5.1.7A9.2 9.2 0 0 1 3.2 4.8a3.2 3.2 0 0 0 1 4.3c-.5 0-1-.2-1.5-.4v.1c0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.2 3 2.2A6.5 6.5 0 0 1 2 15.6a9.2 9.2 0 0 0 5 1.5c6 0 9.3-5 9.3-9.3v-.4c.7-.5 1.2-1 1.7-1.7Z"
          fill="hsl(203, 89%, 53%)"
        />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id="instagram-icon" x1="2" x2="18" y1="18" y2="2">
            <stop stopColor="hsl(37, 97%, 70%)" />
            <stop offset="0.52" stopColor="hsl(5, 77%, 71%)" />
            <stop offset="1" stopColor="hsl(329, 70%, 58%)" />
          </linearGradient>
        </defs>
        <rect
          x="3.1"
          y="3.1"
          width="13.8"
          height="13.8"
          rx="4"
          fill="none"
          stroke="url(#instagram-icon)"
          strokeWidth="2"
        />
        <circle
          cx="10"
          cy="10"
          r="3.3"
          fill="none"
          stroke="url(#instagram-icon)"
          strokeWidth="1.8"
        />
        <circle cx="14" cy="6" r="1.1" fill="url(#instagram-icon)" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8.2" fill="hsl(348, 97%, 39%)" />
      <path d="m8.4 6.9 4.7 3.1-4.7 3.1V6.9Z" fill="#fff" />
    </svg>
  );
}
