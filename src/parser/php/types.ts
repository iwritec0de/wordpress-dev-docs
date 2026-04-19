export interface DocTag {
  tag: string;
  /** Full raw value after the tag name (e.g. "string $key The setting key") */
  raw: string;
}

export interface DocParam {
  type: string;
  name: string;
  description: string;
  optional: boolean;
}

export interface DocReturn {
  type: string;
  description: string;
}

export interface ParsedDocBlock {
  description: string;
  since?: string;
  deprecated?: string;
  params: DocParam[];
  returns?: DocReturn;
  throws: string[];
  /** @var type for properties */
  varType?: string;
  /** All raw tags including unrecognised ones */
  tags: DocTag[];
  /** Raw comment text (stripped of * prefixes) */
  raw: string;
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

/** A single parameter in a function or method signature */
export interface ParsedParam {
  name: string;
  /** Native PHP type hint (e.g. "string", "?int", "array") — null if untyped */
  typeHint: string | null;
  nullable: boolean;
  /** True if the parameter has a default value */
  hasDefault: boolean;
  /** Raw default value string (e.g. "null", "'foo'", "[]") */
  defaultValue: string | null;
  variadic: boolean;
  byRef: boolean;
}

export interface ParsedFunction {
  name: string;
  /** Native PHP return type hint — null if absent */
  returnType: string | null;
  params: ParsedParam[];
  doc: ParsedDocBlock | null;
  location: SourceLocation;
}

export interface ParsedMethod extends ParsedFunction {
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  isAbstract: boolean;
}

export interface ParsedProperty {
  name: string;
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  /** Native PHP property type hint — null if absent */
  typeHint: string | null;
  doc: ParsedDocBlock | null;
  location: SourceLocation;
}

export interface ParsedConstant {
  name: string;
  /** Raw value string */
  value: string | null;
  doc: ParsedDocBlock | null;
  location: SourceLocation;
}

export interface ParsedClass {
  name: string;
  /** Parent class name, if any */
  extends: string | null;
  /** Implemented interface names */
  implements: string[];
  isAbstract: boolean;
  isFinal: boolean;
  isInterface: boolean;
  isTrait: boolean;
  doc: ParsedDocBlock | null;
  methods: ParsedMethod[];
  properties: ParsedProperty[];
  constants: ParsedConstant[];
  location: SourceLocation;
}

export interface PhpParseResult {
  file: string;
  functions: ParsedFunction[];
  classes: ParsedClass[];
  /** Top-level (file-level) constants defined via define() */
  constants: ParsedConstant[];
}
