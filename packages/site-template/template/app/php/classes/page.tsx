import siteData from '@/public/data/site-data.json';
import {
  Card,
  CardHeader,
  CardDesc,
  ClassMeta,
  PropertyTable,
  MethodTable,
  SourceLink,
} from '@/components/ReferenceCard';
import { OverrideBlocks, type OverrideBlock } from '@/components/OverrideBlocks';

interface Property {
  name: string;
  type: string;
  description: string;
  visibility: string;
  isStatic: boolean;
}

interface Method {
  name: string;
  description: string;
  visibility: string;
  isStatic: boolean;
  since: string | null;
  file: string;
  line: number;
}

interface Cls {
  name: string;
  description: string;
  extends: string | null;
  implements: string[];
  isAbstract: boolean;
  isFinal: boolean;
  isInterface: boolean;
  isTrait: boolean;
  since: string | null;
  properties: Property[];
  methods: Method[];
  file: string;
  line: number;
  overrides?: OverrideBlock[];
}

function classKeyword(cls: Cls): string {
  const parts: string[] = [];
  if (cls.isAbstract) parts.push('abstract');
  if (cls.isFinal) parts.push('final');
  parts.push(cls.isInterface ? 'interface' : cls.isTrait ? 'trait' : 'class');
  parts.push(cls.name);
  return parts.join(' ');
}

export default function ClassesPage() {
  const classes: Cls[] = siteData.reference.classes as unknown as Cls[];
  return (
    <div>
      <p className="page-eyebrow">PHP Reference</p>
      <h1 className="mb-2 text-3xl font-bold font-display">Classes</h1>
      <p className="page-desc">
        {classes.length} class{classes.length !== 1 ? 'es' : ''} defined by this plugin.
      </p>
      <div className="space-y-6">
        {classes.map((cls) => (
          <Card key={cls.name} id={cls.name}>
            <CardHeader name={classKeyword(cls)} since={cls.since} />
            {cls.description && <CardDesc>{cls.description}</CardDesc>}
            <ClassMeta extendsClass={cls.extends} implementsList={cls.implements} />
            <PropertyTable properties={cls.properties ?? []} />
            <MethodTable methods={cls.methods} />
            <SourceLink file={cls.file} line={cls.line} />
            {cls.overrides && <OverrideBlocks blocks={cls.overrides} />}
          </Card>
        ))}
      </div>
    </div>
  );
}
