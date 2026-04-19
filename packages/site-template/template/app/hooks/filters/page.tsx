import siteData from '@/public/data/site-data.json';
import { Card, CardHeader, CardDesc, ParamTable, SourceLink } from '@/components/ReferenceCard';
import { OverrideBlocks, type OverrideBlock } from '@/components/OverrideBlocks';

interface HookParam {
  name: string;
  type: string;
  description: string;
}

interface Hook {
  name: string;
  type: string;
  description: string;
  since: string | null;
  dispatchArgCount: number | null;
  params: HookParam[];
  file: string;
  line: number;
  overrides?: OverrideBlock[];
}

export default function FiltersPage() {
  const hooks = siteData.reference.hooks.filters as unknown as Hook[];
  return (
    <div>
      <p className="page-eyebrow">Hooks</p>
      <h1 className="mb-2 text-3xl font-bold font-display">Filters</h1>
      <p className="page-desc">
        {hooks.length} filter{hooks.length !== 1 ? 's' : ''} dispatched by this plugin.
      </p>
      <div className="space-y-6">
        {hooks.map((h) => (
          <Card key={h.name + h.file + h.line} id={h.name}>
            <CardHeader
              name={h.name}
              badges={[
                {
                  label: 'filter',
                  color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
                },
              ]}
              since={h.since}
            />
            {h.description && <CardDesc>{h.description}</CardDesc>}
            {h.params.length > 0 && (
              <ParamTable
                params={h.params.map((p) => ({
                  name: p.name,
                  type: p.type,
                  description: p.description,
                }))}
              />
            )}
            {h.dispatchArgCount !== null && h.params.length === 0 && (
              <p className="text-xs text-muted">
                Passes {h.dispatchArgCount} argument{h.dispatchArgCount !== 1 ? 's' : ''}
              </p>
            )}
            <SourceLink file={h.file} line={h.line} />
            {h.overrides && <OverrideBlocks blocks={h.overrides} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
