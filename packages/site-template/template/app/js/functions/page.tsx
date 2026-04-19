import siteData from '@/public/data/site-data.json';
import {
  Card,
  CardHeader,
  CardDesc,
  ParamTable,
  ReturnType,
  SourceLink,
} from '@/components/ReferenceCard';
import { OverrideBlocks, type OverrideBlock } from '@/components/OverrideBlocks';

interface Param {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}
interface JsFunction {
  name: string;
  description: string;
  params: Param[];
  returns: { type: string; description: string } | null;
  since: string | null;
  deprecated: string | null;
  file: string;
  line: number;
  overrides?: OverrideBlock[];
}

export default function JsFunctionsPage() {
  const functions = siteData.reference.js.functions as unknown as JsFunction[];
  return (
    <div>
      <p className="page-eyebrow">JavaScript API</p>
      <h1 className="mb-2 text-3xl font-bold font-display">Functions</h1>
      <p className="page-desc">
        {functions.length} JavaScript function{functions.length !== 1 ? 's' : ''} exported by this
        plugin.
      </p>
      <div className="space-y-6">
        {functions.map((fn) => (
          <Card key={fn.name} id={fn.name}>
            <CardHeader name={fn.name} suffix="()" since={fn.since} deprecated={fn.deprecated} />
            {fn.description && <CardDesc>{fn.description}</CardDesc>}
            <ParamTable params={fn.params} />
            <ReturnType returns={fn.returns} />
            <SourceLink file={fn.file} line={fn.line} />
            {fn.overrides && <OverrideBlocks blocks={fn.overrides} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
