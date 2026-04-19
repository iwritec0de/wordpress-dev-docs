import type { ReactNode } from 'react';

interface HeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function Hero({ eyebrow, title, description, children }: HeroProps) {
  return (
    <div
      style={{
        padding: '40px 0 32px',
        marginBottom: '40px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '12px',
            fontWeight: 500,
            color: 'var(--color-accent)',
          }}
        >
          {eyebrow}
        </div>
      )}
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          lineHeight: 1.2,
          marginBottom: '16px',
          letterSpacing: '-0.02em',
          color: 'var(--color-fg)',
          background:
            'linear-gradient(135deg, var(--color-fg) 0%, var(--color-accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {title}
      </h1>
      {description && (
        <div
          style={{
            fontSize: '1.125rem',
            lineHeight: 1.7,
            maxWidth: '600px',
            marginBottom: '28px',
            color: 'var(--color-muted)',
          }}
        >
          {description}
        </div>
      )}
      {children && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface HeroButtonProps {
  href: string;
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function HeroButton({
  href,
  variant = 'primary',
  children,
}: HeroButtonProps) {
  const cls =
    variant === 'primary'
      ? 'hero-btn hero-btn-primary'
      : 'hero-btn hero-btn-secondary';
  return (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}
