export interface CssDocBlock {
  description: string;
  /** Raw comment text (stripped of comment delimiters) */
  raw: string;
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

export interface CssCustomProperty {
  /** Property name including -- prefix, e.g. "--color-primary" */
  name: string;
  /** Raw value string, e.g. "#333" or "16px" */
  value: string;
  /** Description from a preceding comment, if any */
  description: string | null;
  /** Selector scope, e.g. ":root", ".dark-mode" */
  scope: string;
  location: SourceLocation;
}

export interface CssParseResult {
  file: string;
  /** File-level doc block (first comment at top of file) */
  fileDoc: CssDocBlock | null;
  customProperties: CssCustomProperty[];
}
