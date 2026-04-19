import type { ReactNode } from 'react';

interface FeatureGridProps {
  children: ReactNode;
}

export function FeatureGrid({ children }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 mb-12 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  iconBg?: string;
  iconColor?: string;
  children?: ReactNode;
}

export function FeatureCard({
  title,
  description,
  iconBg = 'var(--color-accent-subtle)',
  iconColor = 'var(--color-accent)',
  children,
}: FeatureCardProps) {
  return (
    <div className="feature-card">
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-sm, 4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          background: iconBg,
          color: iconColor,
        }}
      >
        {children}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--color-fg)',
          marginBottom: '6px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '0.8125rem',
          color: 'var(--color-muted)',
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </div>
  );
}
