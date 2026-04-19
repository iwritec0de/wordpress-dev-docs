import siteData from '@/public/data/site-data.json';

interface ChangelogEntry {
  version: string;
  notes: string[];
}

export default function ChangelogPage() {
  const changelog: ChangelogEntry[] =
    (siteData as unknown as { changelog?: ChangelogEntry[] }).changelog ?? [];
  return (
    <div>
      <p className="page-eyebrow">Release History</p>
      <h1 className="mb-2 text-3xl font-bold font-display">Changelog</h1>
      <p className="page-desc">
        {changelog.length} release{changelog.length !== 1 ? 's' : ''} documented.
      </p>

      {changelog.length === 0 && <p className="text-muted">No changelog available.</p>}
      <div className="space-y-8">
        {changelog.map((entry) => (
          <section key={entry.version} className="border border-border p-6 rounded-md">
            <h2 className="mb-3 text-xl font-semibold font-display">{entry.version}</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted">
              {entry.notes.map((note: string, i: number) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
