import siteData from '@/public/data/site-data.json';
import { Card, CardHeader, CardDesc, SourceLink } from '@/components/ReferenceCard';
import { OverrideBlocks, type OverrideBlock } from '@/components/OverrideBlocks';

interface Constant {
  name: string;
  value: string | null;
  description: string;
  file: string;
  line: number;
  overrides?: OverrideBlock[];
}

export default function ConstantsPage() {
  const constants = siteData.reference.constants as unknown as Constant[];
  return (
    <div>
      <p className="page-eyebrow">PHP Reference</p>
      <h1 className="mb-2 text-3xl font-bold font-display">Constants</h1>
      <p className="page-desc">
        {constants.length} constant{constants.length !== 1 ? 's' : ''} defined by this plugin.
      </p>
      <div className="space-y-6">
        {constants.map((c) => (
          <Card key={c.name} id={c.name}>
            <CardHeader name={c.name} />
            {c.description && <CardDesc>{c.description}</CardDesc>}
            {c.value && (
              <p className="mb-3 text-sm">
                <span className="text-muted">Value: </span>
                <code className="rounded bg-surface border border-border px-1.5 py-0.5 text-xs font-mono">
                  {c.value}
                </code>
              </p>
            )}
            <SourceLink file={c.file} line={c.line} />
            {c.overrides && <OverrideBlocks blocks={c.overrides} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
