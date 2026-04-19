import type { ReactNode } from 'react';

interface CheckListProps {
  children: ReactNode;
}

/** List with accent-colored check-mark icons. */
export function CheckList({ children }: CheckListProps) {
  return <ul className="mb-4 list-none space-y-1 p-0">{children}</ul>;
}

interface CheckItemProps {
  children: ReactNode;
}

/** Individual item in a CheckList. */
export function CheckItem({ children }: CheckItemProps) {
  return (
    <li className="flex items-start gap-2.5 py-1.5 text-[0.9375rem] leading-relaxed">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 shrink-0 text-accent"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>{children}</span>
    </li>
  );
}
