import siteData from '@/public/data/site-data.json';
import { OverrideBlocks, type OverrideBlock } from '@/components/OverrideBlocks';

interface RestParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

interface RestEndpoint {
  namespace: string;
  route: string;
  fullRoute: string;
  methods: string[];
  description: string;
  params?: RestParam[];
  file: string;
  line: number;
  overrides?: OverrideBlock[];
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a5f50] dark:text-[#60a5fa]',
  POST: 'bg-[#dcfce7] text-[#15803d] dark:bg-[#14532d50] dark:text-[#4ade80]',
  PUT: 'bg-[#fef3c7] text-[#b45309] dark:bg-[#78350f50] dark:text-[#fbbf24]',
  PATCH: 'bg-[#fef3c7] text-[#b45309] dark:bg-[#78350f50] dark:text-[#fbbf24]',
  DELETE: 'bg-[#fee2e2] text-[#dc2626] dark:bg-[#7f1d1d50] dark:text-[#f87171]',
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.04em] ${METHOD_COLORS[method] ?? 'bg-gray-100 text-gray-700'} font-mono`}
    >
      {method}
    </span>
  );
}

/** Derive conventional HTTP response codes from methods */
function getResponseCodes(
  methods: string[]
): { code: number; label: string; category: '2xx' | '4xx' }[] {
  const codes: { code: number; label: string; category: '2xx' | '4xx' }[] = [];
  const seen = new Set<number>();

  for (const m of methods) {
    const upper = m.toUpperCase();
    if (upper === 'GET' && !seen.has(200)) {
      codes.push({ code: 200, label: 'OK', category: '2xx' });
      seen.add(200);
    }
    if (upper === 'POST' && !seen.has(201)) {
      codes.push({ code: 201, label: 'Created', category: '2xx' });
      seen.add(201);
    }
    if ((upper === 'PUT' || upper === 'PATCH') && !seen.has(200)) {
      codes.push({ code: 200, label: 'OK', category: '2xx' });
      seen.add(200);
    }
    if (upper === 'DELETE' && !seen.has(200)) {
      codes.push({ code: 200, label: 'OK', category: '2xx' });
      seen.add(200);
    }
  }

  // Standard error codes
  if (!seen.has(401)) codes.push({ code: 401, label: 'Unauthorized', category: '4xx' });
  if (!seen.has(403)) codes.push({ code: 403, label: 'Forbidden', category: '4xx' });

  return codes;
}

const RESPONSE_CODE_STYLES: Record<string, string> = {
  '2xx':
    'text-[#15803d] border-[#bbf7d0] bg-[#f0fdf4] dark:text-[#4ade80] dark:border-[#14532d] dark:bg-[#14532d30]',
  '4xx':
    'text-[#b45309] border-[#fde68a] bg-[#fffbeb] dark:text-[#fbbf24] dark:border-[#78350f] dark:bg-[#78350f30]',
};

export default function RestEndpointsPage() {
  const endpoints: RestEndpoint[] =
    (siteData.reference as unknown as { restEndpoints?: RestEndpoint[] }).restEndpoints ?? [];

  const namespaces = [...new Set(endpoints.map((ep) => ep.namespace))];

  return (
    <div>
      <p className="page-eyebrow">REST API</p>
      <h1 className="mb-2 text-3xl font-bold font-display">API Endpoints</h1>
      <p className="page-desc">
        {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} registered by this plugin.
        All endpoints use the{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 text-sm font-mono">/wp-json/</code> base
        path.
      </p>

      {/* Base URL box */}
      {namespaces.map((ns) => (
        <div
          key={ns}
          className="mb-8 flex items-center gap-3 border border-border bg-surface px-5 py-4 rounded-md"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Base URL
          </span>
          <code className="text-sm font-mono">/wp-json/{ns}/</code>
        </div>
      ))}

      {/* Endpoint cards */}
      <div className="space-y-6">
        {endpoints.map((ep) => {
          const slug =
            (ep.methods[0] ?? 'get').toLowerCase() +
            '-' +
            ep.route.replace(/^\//, '').replace(/\//g, '-');
          const params = ep.params ?? [];
          const responseCodes = getResponseCodes(ep.methods);
          return (
            <section
              key={slug}
              id={slug}
              className="overflow-hidden border border-border transition-all hover:border-accent rounded-md"
            >
              {/* Header: method badges + route */}
              <div className="flex items-center gap-3 px-6 py-5">
                {ep.methods.map((m) => (
                  <MethodBadge key={m} method={m} />
                ))}
                <code className="text-[0.9375rem] font-medium font-mono">/{ep.fullRoute}</code>
              </div>

              {/* Body */}
              <div className="border-t border-border px-6 py-5">
                {ep.description && (
                  <p className="mb-4 text-[0.9375rem] leading-relaxed text-muted">
                    {ep.description}
                  </p>
                )}

                {/* Parameters table */}
                {params.length > 0 && (
                  <div className="mb-4">
                    <h4 className="mb-1.5 mt-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Parameters
                    </h4>
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
                        {params.map((p: RestParam) => (
                          <tr key={p.name} className="border-b border-border/50">
                            <td className="px-3 py-2 align-top">
                              <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] font-mono">
                                {p.name}
                              </code>
                              {p.required && (
                                <span className="ml-1 text-[10px] font-medium text-red-500">
                                  required
                                </span>
                              )}
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
                )}

                {/* Response codes */}
                <div className="mt-4">
                  <h4 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                    Response Codes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {responseCodes.map((rc) => (
                      <span
                        key={rc.code}
                        className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium ${RESPONSE_CODE_STYLES[rc.category]} font-mono`}
                      >
                        {rc.code} <span className="font-normal opacity-75">{rc.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Source link */}
                <p className="mt-4 text-xs text-muted font-mono">
                  {ep.file}:{ep.line}
                </p>
                {ep.overrides && <OverrideBlocks blocks={ep.overrides} />}
              </div>
            </section>
          );
        })}
      </div>

      {endpoints.length === 0 && <p className="text-muted">No REST API endpoints registered.</p>}
    </div>
  );
}
