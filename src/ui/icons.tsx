import type { ReactNode } from 'react';

/** Tempo icon paths on a 24px grid, drawn with a 2px stroke. */
export const ICONS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  'chevron-left': <path d="M15 5l-7 7 7 7" />,
  'chevron-right': <path d="M9 5l7 7-7 7" />,
  'chevron-down': <path d="M5 9l7 7 7-7" />,
  'chevron-up': <path d="M5 15l7-7 7 7" />,
  'arrow-right': <path d="M4 12h15M13 6l6 6-6 6" />,
  'arrow-left': <path d="M20 12H5M11 6l-6 6 6 6" />,
  warning: (
    <>
      <path d="M12 3.5L2.5 20h19L12 3.5z" />
      <path d="M12 10v4.5M12 17.25v.25" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.75V8" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.25v.25" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  pill: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-35 12 12)" />
      <path d="M9.4 8.3l5.2 7.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  family: (
    <>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M3 19.5c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5M14.5 14.6c.6-.3 1.3-.4 2-.4 2.5 0 4.5 1.9 4.5 4.8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </>
  ),
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3L7 7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7" />
    </>
  ),
  sunrise: (
    <>
      <path d="M7 16a5 5 0 0110 0" />
      <path d="M2.5 19.5h19M12 4v4M4.6 9.6l1.8 1.8M19.4 9.6l-1.8 1.8" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  sunset: (
    <>
      <path d="M7 16a5 5 0 0110 0" />
      <path d="M2.5 19.5h19M12 9V4M9.5 6.5L12 9l2.5-2.5" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />,
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 010 18z" fill="currentColor" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5.5M14 11v5.5" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8h4l1.5-2.5h6L16.5 8h4v11.5h-17z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  place: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
    </>
  ),
  undo: (
    <>
      <path d="M8.5 5L4 9.5 8.5 14" />
      <path d="M4 9.5h10a5.5 5.5 0 010 11h-3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  external: (
    <>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5.5H4.5V6H10" />
    </>
  ),
  share: (
    <>
      <path d="M12 3.5v12M7.5 8L12 3.5 16.5 8" />
      <path d="M5 12.5v7.5h14v-7.5" />
    </>
  ),
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
      <path d="M15.5 8.5V5.5a1.5 1.5 0 00-1.5-1.5H5.5A1.5 1.5 0 004 5.5V14a1.5 1.5 0 001.5 1.5h3" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7a4.3 4.3 0 017.5 2.8C19.5 15.4 12 20 12 20z" />
  ),
  list: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.5M4.5 12h.5M4.5 17.5h.5" />,
  text: <path d="M4 18L9 6l5 12M5.7 14h6.6M15 18l3-7.5 3 7.5M15.8 16h4.4" />,
  book: (
    <>
      <path d="M4 5.5A1.5 1.5 0 015.5 4H11v16H5.5A1.5 1.5 0 014 18.5z" />
      <path d="M20 5.5A1.5 1.5 0 0018.5 4H13v16h5.5a1.5 1.5 0 001.5-1.5z" />
    </>
  ),
  refill: (
    <>
      <path d="M20 12a8 8 0 01-14 5.3M4 12a8 8 0 0114-5.3" />
      <path d="M18 3v4h-4M6 21v-4h4" />
    </>
  ),
  food: (
    <>
      <path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10" />
      <path d="M17 21V3c-2 1.5-3 4-3 7h3" />
    </>
  ),
  flame: (
    <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.5 3.6-8.3.4 1.9 1.4 3 2.7 3.6-.3-2.7.9-5.3 3.2-7.1-.3 2.6.9 4.4 2.3 6.1 1.2 1.5 1.7 3.1 1.7 5 0 4.1-3 6.9-7 6.9z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  command: (
    <path d="M9 9V6.5A2.5 2.5 0 106.5 9H9zm0 0h6m-6 0v6m6-6V6.5A2.5 2.5 0 1117.5 9H15zm0 0v6m0 0h2.5a2.5 2.5 0 11-2.5 2.5V15zm0 0H9m0 0v2.5A2.5 2.5 0 116.5 15H9z" />
  ),
  download: <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />,
  upload: <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5l1.9 5 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.4l5.1-1.9z M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
  ),
  'calendar-plus': (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
    </>
  ),
  swipe: <path d="M4 12h12M12 7l5 5-5 5M20 6v12" />,
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
