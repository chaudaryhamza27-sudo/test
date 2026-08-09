// Lightweight inline SVG icon set for the PK92 UI (no external icon library installed).
export const IconEagle = (props) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <circle cx="24" cy="24" r="24" fill="url(#eagleGrad)" />
    <path
      d="M24 12c-1.6 2.4-4 3.8-7 4.4 1.4.9 2.6 1.1 4 1-2.6 2-6.8 3-9 2.6 2 2.2 5 3 7.4 2.4-1 1.6-3.4 2.6-5.4 2.4 2.4 2.4 6 2.8 9-.4-1.2 2-1.6 4.4-1 6.4.9-1.8 1.4-3.8 1.4-6 0 2.2.5 4.2 1.4 6 .6-2 .2-4.8-1-6.4 3-.2 6.6-.6 9-2.8-2 .2-4.4-.8-5.4-2.4 2.4.6 5.4-.2 7.4-2.4-2.2.4-6.4-.6-9-2.6 1.4.1 2.6-.1 4-1-3-.6-5.4-2-7-4.4Z"
      fill="#7a4a06"
      opacity=".85"
    />
    <circle cx="24" cy="19" r="2.1" fill="#7a4a06" />
    <defs>
      <linearGradient id="eagleGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffe27a" />
        <stop offset="1" stopColor="#f2ab13" />
      </linearGradient>
    </defs>
  </svg>
);

export const IconCoinWallet = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="6" width="18" height="13" rx="3" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
    <path d="M7 6V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconSpeaker = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
    <path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

export const IconChevronLeft = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const IconChevronRight = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconWallet = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    <path d="M16 12h3v3h-3a1.5 1.5 0 0 1 0-3Z" />
    <path d="M3 8h14" />
  </svg>
);

export const IconDeposit = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path d="M4 18h16" />
  </svg>
);

export const IconWithdraw = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20V9m0 0 4 4m-4-4-4 4" />
    <path d="M4 4h16" />
  </svg>
);

export const IconHistory = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
);

export const IconVip = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 8l4 3 5-6 5 6 4-3-2 10H5L3 8Z" />
  </svg>
);

export const IconGameHistory = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M7 9v4M5 11h4" />
    <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTransaction = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </svg>
);

export const IconBell = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

export const IconGift = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="9" width="18" height="11" rx="2" />
    <path d="M3 13h18M12 9v11" />
    <path d="M12 9c-1.2 0-3-.8-3-2.5S10.3 4 12 5.5C13.7 4 16 4.5 16 6.5S13.2 9 12 9Z" />
  </svg>
);

export const IconCopy = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

export const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
    <path d="M18 3v4h-4M6 21v-4h4" />
  </svg>
);

export const IconQr = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPromotion = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20.8 4.6a5 5 0 0 0-7.1 0l-.7.7-.7-.7a5 5 0 1 0-7.1 7.1L12 19l6.8-7.3a5 5 0 0 0 0-7.1Z" />
  </svg>
);

export const IconActivity = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="9" width="16" height="11" rx="2" />
    <path d="M4 13h16M9 9V7a3 3 0 0 1 6 0v2" />
  </svg>
);

export const IconGame = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 8h3M8.5 6.5v3" />
    <circle cx="16" cy="7.8" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="9.8" r="1" fill="currentColor" stroke="none" />
    <path d="M6.5 8H17a3.5 3.5 0 0 1 3.4 4.3l-.6 2.6a2.6 2.6 0 0 1-4.6 1L14 14H10l-1.2 1.9a2.6 2.6 0 0 1-4.6-1l-.6-2.6A3.5 3.5 0 0 1 6.5 8Z" />
  </svg>
);

export const IconAccount = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c1-3.6 4-5.5 7-5.5s6 1.9 7 5.5" />
  </svg>
);

export const IconSlots = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8 4v16M16 4v16" />
    <circle cx="8" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconLottery = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="9" r="4.5" />
    <circle cx="16" cy="15" r="4.5" />
  </svg>
);

export const IconCasino = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="6" width="10" height="14" rx="2" transform="rotate(-8 8 13)" />
    <rect x="10" y="4" width="10" height="14" rx="2" />
  </svg>
);

export const IconRummy = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="7" r="3" />
    <path d="M5 20c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);

export const IconFishing = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12s3.5-4 9-4 9 4 9 4-3.5 4-9 4-9-4-9-4Z" />
    <circle cx="16.5" cy="12" r="1" fill="currentColor" stroke="none" />
    <path d="M21 12c1 1 1 2.5 0 3.5" />
  </svg>
);

export const IconPhone = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="7" y="3" width="10" height="18" rx="2.4" />
    <path d="M11 17.5h2" />
  </svg>
);

export const IconMail = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.4" />
    <path d="M4 6.5 12 13l8-6.5" />
  </svg>
);

export const IconLockLine = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.4" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconEye = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const IconEyeOff = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6.2 0 10 6.5 10 6.5a15.6 15.6 0 0 1-3.4 4M6.6 6.9C4 8.6 2 12 2 12s3.8 6.5 10 6.5c1.4 0 2.6-.3 3.7-.8" />
    <path d="M9.9 9.9a2.6 2.6 0 0 0 3.6 3.6" />
  </svg>
);

export const IconChevronDown = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconSupport = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 11a8 8 0 1 1 12.8 6.4L18 21l-4-1.2A8 8 0 0 1 4 11Z" />
    <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="11" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconFlagUS = (props) => (
  <svg viewBox="0 0 24 16" {...props}>
    <clipPath id="flagClip">
      <rect x="0" y="0" width="24" height="16" rx="3" />
    </clipPath>
    <g clipPath="url(#flagClip)">
      <rect width="24" height="16" fill="#b22234" />
      <g fill="#fff">
        <rect y="1.23" width="24" height="1.23" />
        <rect y="3.69" width="24" height="1.23" />
        <rect y="6.15" width="24" height="1.23" />
        <rect y="8.62" width="24" height="1.23" />
        <rect y="11.08" width="24" height="1.23" />
        <rect y="13.54" width="24" height="1.23" />
      </g>
      <rect width="10" height="8.62" fill="#3c3b6e" />
    </g>
  </svg>
);
