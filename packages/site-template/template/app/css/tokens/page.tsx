import React from 'react';
import siteData from '@/public/data/site-data.json';
import { Card } from '@/components/ReferenceCard';
import { OverrideBlocks, type OverrideBlock } from '@/components/OverrideBlocks';

interface Token {
  name: string;
  value: string;
  description: string | null;
  scope: string;
  file: string;
  line: number;
  overrides?: OverrideBlock[];
}

export default function CssTokensPage() {
  const tokens = siteData.reference.cssTokens as unknown as Token[];
  const scopes = [...new Set(tokens.map((t) => t.scope))];
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">CSS Design Tokens</h1>
      <p className="mb-6 text-sm text-muted">
        {tokens.length} custom propert{tokens.length !== 1 ? 'ies' : 'y'}
      </p>
      {tokens.length === 0 && <p className="text-muted">No CSS tokens found.</p>}
      {scopes.map((scope) => (
        <div key={scope} className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            <code className="rounded bg-surface border border-border px-1.5 py-0.5 text-base font-mono">
              {scope}
            </code>
          </h2>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-2 py-1.5 font-medium">Property</th>
                  <th className="px-2 py-1.5 font-medium">Value</th>
                  <th className="px-2 py-1.5 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {tokens
                  .filter((t) => t.scope === scope)
                  .map((t) => (
                    <React.Fragment key={t.name}>
                      <tr className="border-b border-border/50">
                        <td className="px-2 py-1.5">
                          <code className="text-xs">{t.name}</code>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            {t.value.startsWith('#') && (
                              <span
                                className="inline-block h-3 w-3 rounded-sm border border-border"
                                style={{ backgroundColor: t.value }}
                              />
                            )}
                            <code className="text-xs">{t.value}</code>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-muted">{t.description ?? ''}</td>
                      </tr>
                      {t.overrides && (
                        <tr>
                          <td colSpan={3} className="px-2 pb-3">
                            <OverrideBlocks blocks={t.overrides} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </Card>
        </div>
      ))}
    </div>
  );
}
