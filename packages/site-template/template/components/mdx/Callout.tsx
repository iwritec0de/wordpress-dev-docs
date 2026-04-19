import type { ReactNode } from 'react';

type CalloutType = 'info' | 'warn' | 'tip' | 'danger';

const styles: Record<CalloutType, { bg: string; darkBg: string; iconColor: string }> = {
  info: {
    bg: 'bg-[var(--callout-info-bg)]',
    darkBg: 'dark:outline dark:outline-1 dark:outline-[var(--callout-info-outline)]',
    iconColor: 'text-accent',
  },
  tip: {
    bg: 'bg-[var(--callout-tip-bg)]',
    darkBg: 'dark:outline dark:outline-1 dark:outline-[var(--callout-tip-outline)]',
    iconColor: 'text-[var(--callout-tip-icon)]',
  },
  warn: {
    bg: 'bg-[var(--callout-warn-bg)]',
    darkBg: 'dark:outline dark:outline-1 dark:outline-[var(--callout-warn-outline)]',
    iconColor: 'text-[var(--callout-warn-icon)]',
  },
  danger: {
    bg: 'bg-[var(--callout-danger-bg)]',
    darkBg: 'dark:outline dark:outline-1 dark:outline-[var(--callout-danger-outline)]',
    iconColor: 'text-[var(--callout-danger-icon)]',
  },
};

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const icons: Record<CalloutType, () => ReactNode> = {
  info: InfoIcon,
  tip: TipIcon,
  warn: WarnIcon,
  danger: DangerIcon,
};

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const s = styles[type];
  const Icon = icons[type];
  return (
    <div className={`my-6 flex gap-3 rounded-xl px-5 py-4 ${s.bg} ${s.darkBg}`}>
      <div className={`shrink-0 leading-[1.5] ${s.iconColor}`}>
        <Icon />
      </div>
      <div className="text-[0.9375rem] [&_p:last-child]:mb-0">
        {title && (
          <div className="mb-1 font-semibold">{title}</div>
        )}
        {children}
      </div>
    </div>
  );
}
