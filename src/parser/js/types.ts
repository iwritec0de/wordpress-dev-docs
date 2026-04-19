export interface JsDocParam {
  type: string | null;
  name: string;
  description: string;
  optional: boolean;
}

export interface JsDocReturn {
  type: string | null;
  description: string;
}

export interface ParsedJsDocBlock {
  description: string;
  since?: string;
  deprecated?: string;
  params: JsDocParam[];
  returns?: JsDocReturn;
  throws: string[];
  tags: Array<{ tag: string; raw: string }>;
  raw: string;
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

export interface ParsedJsFunction {
  name: string;
  doc: ParsedJsDocBlock | null;
  location: SourceLocation;
}

export interface ParsedJsMethod {
  name: string;
  isStatic: boolean;
  doc: ParsedJsDocBlock | null;
  location: SourceLocation;
}

export interface ParsedJsClass {
  name: string;
  doc: ParsedJsDocBlock | null;
  methods: ParsedJsMethod[];
  location: SourceLocation;
}

export interface WpHookCall {
  type: 'addAction' | 'addFilter' | 'doAction' | 'applyFilters';
  hookName: string;
  namespace?: string;
  priority?: number;
  file: string;
  line: number;
}

export interface WpDataUsage {
  type: 'select' | 'dispatch' | 'subscribe';
  store?: string;
  file: string;
  line: number;
}

export interface WpBlockRegistration {
  blockName: string;
  file: string;
  line: number;
}

export interface WpApiUsage {
  hooks: WpHookCall[];
  data: WpDataUsage[];
  blocks: WpBlockRegistration[];
}

export interface JsParseResult {
  file: string;
  functions: ParsedJsFunction[];
  classes: ParsedJsClass[];
  wpApis?: WpApiUsage;
}
