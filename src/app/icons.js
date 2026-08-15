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

export const IconTrendingUp = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

export const IconTrophy = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5a2 2 0 0 0 0 4h3M16 5h3a2 2 0 0 1 0 4h-3" />
    <path d="M10 15v2M14 15v2" />
    <path d="M8 20h8" />
    <path d="M10 17h4v3h-4z" />
  </svg>
);

export const IconShield = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconDocument = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 3h7l4 4v14H7V3Z" />
    <path d="M14 3v4h4" />
    <path d="M9.5 12h5M9.5 15.5h5M9.5 8.5h2" />
  </svg>
);

export const IconUsers = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <path d="M16 4.2a3 3 0 0 1 0 5.8" />
    <path d="M19.5 20c0-2.8-2-5.2-4.7-5.9" />
  </svg>
);

export const IconGlobe = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
  </svg>
);

export const IconCalendar = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3.5" y="5" width="17" height="16" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

export const IconClock = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconCheck = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const IconUpload = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const IconPlane = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21 12.5c0 .4-.3.8-.7.9l-5.6 1.8-2 5.7c-.1.4-.5.6-.9.5-.3-.1-.5-.3-.6-.6l-1-5.9-4.1 1.3-.9 2c-.1.3-.4.5-.7.5-.4 0-.8-.3-.8-.8v-3l-1.5-.5c-.3-.1-.5-.4-.5-.8 0-.3.2-.6.5-.7l1.5-.5V9.2c0-.4.3-.7.8-.7.3 0 .6.2.7.5l.9 2 4.1 1.3 1-5.9c0-.3.3-.6.6-.6.4-.1.8.1.9.5l2 5.7 5.6 1.8c.4.1.7.5.7.9Z" />
  </svg>
);

export const IconChartLine = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="M7 15l4-4 3 3 6-7" />
  </svg>
);

export const IconExpand = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 3H3v6M15 21h6v-6M3 15v6h6M21 9V3h-6" />
  </svg>
);

export const IconLogout = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const IconSettings = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const IconFeedback = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
  </svg>
);

export const IconMegaphone = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" />
    <path d="M15 8a4 4 0 0 1 0 8" />
    <path d="M18 5a8 8 0 0 1 0 14" />
  </svg>
);

export const IconGrid = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconHeadset = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Z" />
    <path d="M20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
    <path d="M18 17.5a4 4 0 0 1-4 3.5h-1.5" />
  </svg>
);

export const IconStar = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.8-4.6 6.6-.9L12 2.5Z" />
  </svg>
);

export const IconLink = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.5 14.5l5-5" />
    <path d="M11 7.5l1-1a3.5 3.5 0 0 1 5 5l-1 1M13 16.5l-1 1a3.5 3.5 0 0 1-5-5l1-1" />
  </svg>
);

export const IconHome = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

export const IconInfo = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10.5v5.5" />
    <circle cx="12" cy="7.6" r="1" fill="currentColor" stroke="none" />
  </svg>
);

// Recommended-games art — original full-colour flat illustrations standing
// in for each game's theme (no copyrighted artwork), rendered large on a
// tinted card. Fills are explicit hex, not currentColor, so they read as
// small illustrations rather than monoline icons.
export const IconGameAviator = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <g transform="rotate(-25 24 24)">
      <path d="M6 24 18 20.5h16l7 3.5-7 3.5H18Z" fill="#e0342f" />
      <path d="M21 21 30.5 7 35 7 28 21Z" fill="#fff" />
      <path d="M21 27 30.5 41 35 41 28 27Z" fill="#fff" opacity=".95" />
      <path d="M8 24 14.5 20 14.5 28Z" fill="#b9241f" />
      <circle cx="33.5" cy="24" r="3.1" fill="#3aa0ff" />
      <path d="M40 21.5 46.5 24 40 26.5Z" fill="#ffd166" />
    </g>
  </svg>
);

export const IconGameOx = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path d="M8 14c3 4 7 5.5 11 4.6M40 14c-3 4-7 5.5-11 4.6" stroke="#3b1f0f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    <path d="M11 17c-.4-4 2.6-7 6-7M37 17c.4-4-2.6-7-6-7" stroke="#3b1f0f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    <circle cx="24" cy="26" r="13.5" fill="#d69a3c" />
    <ellipse cx="24" cy="31" rx="7" ry="5.4" fill="#f2c877" />
    <circle cx="19.5" cy="24.5" r="1.8" fill="#241305" />
    <circle cx="28.5" cy="24.5" r="1.8" fill="#241305" />
    <circle cx="21.5" cy="31" r="1.4" fill="#241305" />
    <circle cx="26.5" cy="31" r="1.4" fill="#241305" />
    <rect x="20" y="34" width="8" height="3" rx="1.5" fill="#7a4a06" />
    <circle cx="35" cy="36" r="5.4" fill="#ffd166" stroke="#c98f1c" strokeWidth="1.4" />
    <path d="M33.4 38.2h3.2M35 34.8v3.4" stroke="#7a5000" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export const IconGameWheel = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <circle cx="24" cy="25" r="18" fill="#2a1450" />
    <path d="M24 25 24 7A18 18 0 0 1 36.7 12.3Z" fill="#ff5c8a" />
    <path d="M24 25 36.7 12.3A18 18 0 0 1 42 25Z" fill="#ffd166" />
    <path d="M24 25 42 25A18 18 0 0 1 36.7 37.7Z" fill="#28e7ff" />
    <path d="M24 25 36.7 37.7A18 18 0 0 1 24 43Z" fill="#7c3cff" />
    <path d="M24 25 24 43A18 18 0 0 1 11.3 37.7Z" fill="#ffd166" />
    <path d="M24 25 11.3 37.7A18 18 0 0 1 6 25Z" fill="#ff5c8a" />
    <path d="M24 25 6 25A18 18 0 0 1 11.3 12.3Z" fill="#28e7ff" />
    <path d="M24 25 11.3 12.3A18 18 0 0 1 24 7Z" fill="#7c3cff" />
    <circle cx="24" cy="25" r="5" fill="#ffe9a8" stroke="#c98f1c" strokeWidth="1.4" />
    <path d="M24 3 27.5 9.4 20.5 9.4Z" fill="#e0342f" />
  </svg>
);

export const IconGameCards = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <g transform="rotate(-18 24 26)">
      <rect x="8" y="10" width="17" height="24" rx="3" fill="#fff" stroke="#d9d9e3" />
      <text x="12.5" y="21" fontSize="9" fontWeight="800" fill="#e0342f">K</text>
      <text x="12.5" y="31.5" fontSize="10" fill="#e0342f">♥</text>
    </g>
    <g>
      <rect x="15.5" y="7" width="17" height="24" rx="3" fill="#fff" stroke="#d9d9e3" />
      <text x="20" y="18" fontSize="9" fontWeight="800" fill="#1a1a1a">A</text>
      <text x="20" y="28.5" fontSize="10" fill="#1a1a1a">♠</text>
    </g>
    <g transform="rotate(18 24 26)">
      <rect x="23" y="10" width="17" height="24" rx="3" fill="#fff" stroke="#d9d9e3" />
      <text x="27.5" y="21" fontSize="9" fontWeight="800" fill="#e0342f">Q</text>
      <text x="27.5" y="31.5" fontSize="10" fill="#e0342f">♦</text>
    </g>
  </svg>
);

export const IconGameCrown = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path d="M8 34h32l3-17-10 6.5L24 12l-9 11.5L5 17Z" fill="#ffd166" stroke="#c98f1c" strokeWidth="1.4" strokeLinejoin="round" />
    <rect x="8" y="34" width="32" height="5" rx="1.5" fill="#e0342f" />
    <circle cx="24" cy="24" r="3" fill="#3aa0ff" />
    <circle cx="15" cy="27" r="2.4" fill="#ff5c8a" />
    <circle cx="33" cy="27" r="2.4" fill="#37f59a" />
    <circle cx="24" cy="9.5" r="2.2" fill="#ffe9a8" />
  </svg>
);

export const IconGameFish = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path d="M6 27c6-9 16-14 27-13 6 .5 10 4 12 8-3 5-8 9-14 10-11 2-21-1-25-5Z" fill="#1fa6a0" />
    <path d="M45 22c-3 1.5-3 6 0 8-4-.5-7-3-8-6 1-3 5-3.5 8-2Z" fill="#167f7c" />
    <circle cx="16" cy="24" r="2.2" fill="#08312f" />
    <path d="M12 30c4 2 10 3 16 2" stroke="#0d403d" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <path d="M20 15c3 2 5 5 5 8" stroke="#8fe9e2" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
  </svg>
);

export const IconGameDragon = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path d="M6 30c4-1 6-4 6.5-8 .8-6.5 6-11 12.5-11 5 0 8.5 2.4 10.5 5.4" stroke="#ffd166" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    <path d="M26 12c3.4-2.6 8-2.6 11 .4M35 14c2.2.8 4 2.6 4.8 5" stroke="#f2ab13" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M15 19c5-.4 11 2 14 7.2 2 3.8 5.8 5.8 10 5.2" stroke="#ffe9a8" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="41" cy="15.5" r="1.8" fill="#e0342f" />
    <path d="M6 30c2 3 5.6 5 9.4 5" stroke="#ffd166" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    <circle cx="14" cy="37" r="5.4" fill="#ffd166" stroke="#c98f1c" strokeWidth="1.4" />
    <path d="M12.4 39.2h3.2M14 35.8v3.4" stroke="#7a5000" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
