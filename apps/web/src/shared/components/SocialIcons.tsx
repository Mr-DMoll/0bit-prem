// Minimal monochrome brand marks — lucide-react dropped brand/logo icons a
// few versions back, so these are small inline SVGs instead, matching the
// GoogleIcon pattern already used elsewhere (AccountHeaderWidget).

interface IconProps {
  size?: number;
}

export function InstagramIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <polygon points="10,9 10,15 15,12" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 8.5h2.5V5.5h-2.5c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.5l.5-3H13V9.5c0-.5.4-1 1-1z" />
    </svg>
  );
}

export function XIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4l7 8.5L4.5 20H7l5.2-6L17 20h3l-7.3-8.8L19.5 4H17l-4.8 5.6L8 4H4z" />
    </svg>
  );
}
