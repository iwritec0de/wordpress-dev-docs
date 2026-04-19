'use client';

import { useState, type ReactNode, type ReactElement } from 'react';

interface TabProps {
  label: string;
  children: ReactNode;
}

export function Tab({ children }: TabProps) {
  return <div>{children}</div>;
}

interface TabsProps {
  children: ReactElement<TabProps> | ReactElement<TabProps>[];
}

export function Tabs({ children }: TabsProps) {
  const tabs = Array.isArray(children) ? children : [children];
  const [active, setActive] = useState(0);

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex border-b border-border bg-sidebar-bg">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              i === active ? 'border-b-2 border-accent text-accent' : 'text-muted hover:text-fg'
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="p-4">{tabs[active]}</div>
    </div>
  );
}
