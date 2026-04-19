'use client';

import { useState } from 'react';

// ─── Shared card wrapper ─────────────────────────────────────────────────────

interface CardProps {
  id?: string;
  children: React.ReactNode;
}

export function Card({ id, children }: CardProps) {
  return (
    <section
      id={id}
      className="mb-4 rounded-md border border-border p-6 transition-all hover:border-accent"
    >
      {children}
    </section>
  );
}

// ─── Card header with name, badges, since tag ────────────────────────────────

interface CardHeaderProps {
  name: string;
  suffix?: string;
  badges?: { label: string; color: string }[];
  since?: string | null;
  deprecated?: string | null;
}

export function CardHeader({ name, suffix, badges, since, deprecated }: CardHeaderProps) {
  return (
    <div className="mb-2 flex items-start justify-between">
      <div>
        <h2 className="inline text-base font-medium font-mono">
          {name}
          {suffix}
        </h2>
        {deprecated && (
          <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            deprecated
          </span>
        )}
        {badges?.map((b) => (
          <span
            key={b.label}
            className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.color}`}
          >
            {b.label}
          </span>
        ))}
      </div>
      {since && (
        <span className="ml-3 shrink-0 text-xs font-medium uppercase tracking-wider text-muted whitespace-nowrap">
          Since {since}
        </span>
      )}
    </div>
  );
}

// ─── Description ────────────────────────────────────────────────────────────

export function CardDesc({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">{children}</p>;
}

// ─── Section title (Parameters, Properties, Methods) ────────────────────────

export function SectionTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-1.5 mt-5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
      {icon}
      {children}
    </h3>
  );
}

// ─── Parameter table ─────────────────────────────────────────────────────────

interface Param {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
}

export function ParamTable({ params }: { params: Param[] }) {
  if (params.length === 0) return null;
  return (
    <div className="mb-3">
      <SectionTitle
        icon={
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        }
      >
        Parameters
      </SectionTitle>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Name
            </th>
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Type
            </th>
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border/50">
              <td className="px-3 py-2 align-top">
                <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
                  {p.optional ? '[' : ''}
                  {p.name}
                  {p.optional ? ']' : ''}
                </code>
              </td>
              <td className="px-3 py-2 align-top">
                <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
                  {p.type}
                </code>
              </td>
              <td className="px-3 py-2 align-top text-muted">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Return type display ─────────────────────────────────────────────────────

interface ReturnInfo {
  type: string;
  description: string;
}

export function ReturnType({ returns }: { returns: ReturnInfo | null }) {
  if (!returns) return null;
  return (
    <p className="mt-3 text-sm">
      <strong className="font-semibold">Returns:</strong>{' '}
      <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">{returns.type}</code>
      {returns.description ? ' — ' + returns.description : ''}
    </p>
  );
}

// ─── Source file location ────────────────────────────────────────────────────

export function SourceLink({ file, line }: { file: string; line: number }) {
  return (
    <p className="mt-3 text-xs text-muted font-mono">
      {file}:{line}
    </p>
  );
}

// ─── Visibility badge ───────────────────────────────────────────────────────

const VISIBILITY_CLASSES: Record<string, string> = {
  public: 'bg-vis-public-bg text-vis-public-fg',
  protected: 'bg-vis-protected-bg text-vis-protected-fg',
  private: 'bg-vis-private-bg text-vis-private-fg',
};

export function VisibilityBadge({ visibility }: { visibility: string }) {
  const cls = VISIBILITY_CLASSES[visibility] ?? VISIBILITY_CLASSES['public'];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium font-mono ${cls}`}
    >
      {visibility}
    </span>
  );
}

export function StaticBadge() {
  return (
    <span className="ml-1 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium font-mono bg-vis-static-bg text-vis-static-fg">
      static
    </span>
  );
}

// ─── Property table (for classes) ───────────────────────────────────────────

interface Property {
  name: string;
  type: string;
  description: string;
  visibility: string;
  isStatic: boolean;
}

export function PropertyTable({ properties }: { properties: Property[] }) {
  if (properties.length === 0) return null;
  return (
    <div className="mb-3">
      <SectionTitle
        icon={
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
          </svg>
        }
      >
        Properties
      </SectionTitle>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Name
            </th>
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Visibility
            </th>
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Type
            </th>
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.name} className="border-b border-border/50">
              <td className="px-3 py-2 align-top">
                <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
                  ${p.name}
                </code>
              </td>
              <td className="px-3 py-2 align-top">
                <VisibilityBadge visibility={p.visibility} />
                {p.isStatic && <StaticBadge />}
              </td>
              <td className="px-3 py-2 align-top">
                <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
                  {p.type || 'mixed'}
                </code>
              </td>
              <td className="px-3 py-2 align-top text-muted">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Method table (for classes) ─────────────────────────────────────────────

interface Method {
  name: string;
  description: string;
  visibility: string;
  isStatic: boolean;
}

export function MethodTable({ methods }: { methods: Method[] }) {
  const [expanded, setExpanded] = useState(false);
  if (methods.length === 0) return null;

  const visible = expanded ? methods : methods.slice(0, 8);
  const hasMore = methods.length > 8;

  return (
    <div className="mb-3">
      <SectionTitle
        icon={
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="m18 16 4-4-4-4" />
            <path d="m6 8-4 4 4 4" />
            <path d="m14.5 4-5 16" />
          </svg>
        }
      >
        Methods ({methods.length})
      </SectionTitle>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Method
            </th>
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Visibility
            </th>
            <th className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((m) => (
            <tr key={m.name} className="border-b border-border/50">
              <td className="px-3 py-2 align-top">
                <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
                  {m.name}()
                </code>
              </td>
              <td className="px-3 py-2 align-top">
                <VisibilityBadge visibility={m.visibility} />
                {m.isStatic && <StaticBadge />}
              </td>
              <td className="px-3 py-2 align-top text-muted">{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-accent hover:underline"
        >
          Show {methods.length - 8} more methods...
        </button>
      )}
    </div>
  );
}

// ─── Class metadata (extends, implements) ───────────────────────────────────

export function ClassMeta({
  extendsClass,
  implementsList,
}: {
  extendsClass: string | null;
  implementsList: string[];
}) {
  if (!extendsClass && implementsList.length === 0) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
      {extendsClass && (
        <div className="flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-muted"
          >
            <polyline points="15 3 21 3 21 9" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <path d="M21 14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
          </svg>
          <span className="text-xs text-muted">Extends:</span>
          <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
            {extendsClass}
          </code>
        </div>
      )}
      {implementsList.length > 0 && (
        <div className="flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-muted"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="text-xs text-muted">Implements:</span>
          {implementsList.map((name) => (
            <code key={name} className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
              {name}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hook card badge ─────────────────────────────────────────────────────────

export function HookBadge({ type }: { type: string }) {
  const isAction = type === 'action';
  const color = isAction
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    : 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400';
  return (
    <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {type}
    </span>
  );
}

// ─── Backward-compatible exports ────────────────────────────────────────────
// MethodList is replaced by MethodTable, but keep for any pages still using it.
export { MethodTable as MethodList };
