/** MCP reference output format — consumed by AI agents */

/**
 * User-supplied override block attached to a reference item during site
 * scaffolding. Structurally matches `OverrideBlock` from `src/overrides/schema.ts`
 * — declared here to keep MCP item types self-contained (no circular import).
 *
 * IMPORTANT: `overrides` is populated only during site scaffolding and is NOT
 * serialised by the MCP server. The field is optional on every item type below
 * so the "reference without overrides" invariant is enforced by types rather
 * than by convention.
 */
export type McpOverrideBlock =
  | {
      type: 'tip';
      content: string;
      variant: 'info' | 'warning' | 'success';
    }
  | {
      type: 'code';
      content: string;
      label?: string;
      language: string;
    };

export interface McpParam {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

export interface McpReturn {
  type: string;
  description: string;
}

export interface McpFunction {
  name: string;
  description: string;
  params: McpParam[];
  returns: McpReturn | null;
  since: string | null;
  deprecated: string | null;
  file: string;
  line: number;
  /** Populated during site scaffolding only — see {@link McpOverrideBlock}. */
  overrides?: McpOverrideBlock[];
}

export interface McpMethod extends McpFunction {
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  isAbstract: boolean;
}

export interface McpProperty {
  name: string;
  type: string | null;
  description: string;
  visibility: 'public' | 'protected' | 'private';
  isStatic: boolean;
  file: string;
  line: number;
}

export interface McpConstant {
  name: string;
  value: string | null;
  description: string;
  file: string;
  line: number;
  /** Populated during site scaffolding only — see {@link McpOverrideBlock}. */
  overrides?: McpOverrideBlock[];
}

export interface McpClass {
  name: string;
  description: string;
  extends: string | null;
  implements: string[];
  isAbstract: boolean;
  isFinal: boolean;
  isInterface: boolean;
  isTrait: boolean;
  since: string | null;
  methods: McpMethod[];
  properties: McpProperty[];
  constants: McpConstant[];
  file: string;
  line: number;
  /** Populated during site scaffolding only — see {@link McpOverrideBlock}. */
  overrides?: McpOverrideBlock[];
}

export interface McpHook {
  name: string;
  type: 'action' | 'filter';
  description: string;
  since: string | null;
  /** Number of values passed at dispatch sites */
  dispatchArgCount: number | null;
  params: McpParam[];
  file: string;
  line: number;
  /** Populated during site scaffolding only — see {@link McpOverrideBlock}. */
  overrides?: McpOverrideBlock[];
}

export interface McpJsFunction {
  name: string;
  description: string;
  params: McpParam[];
  returns: McpReturn | null;
  since: string | null;
  deprecated: string | null;
  file: string;
  line: number;
  /** Populated during site scaffolding only — see {@link McpOverrideBlock}. */
  overrides?: McpOverrideBlock[];
}

export interface McpCssToken {
  name: string;
  value: string;
  description: string | null;
  scope: string;
  file: string;
  line: number;
  /** Populated during site scaffolding only — see {@link McpOverrideBlock}. */
  overrides?: McpOverrideBlock[];
}

export interface McpRestEndpointParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface McpRestEndpoint {
  namespace: string;
  route: string;
  fullRoute: string;
  methods: string[];
  description: string;
  params: McpRestEndpointParam[];
  file: string;
  line: number;
  /** Populated during site scaffolding only — see {@link McpOverrideBlock}. */
  overrides?: McpOverrideBlock[];
}

export interface McpRestField {
  objectType: string;
  fieldName: string;
  description: string;
  type: string;
  context: string[];
  hasGetCallback: boolean;
  hasUpdateCallback: boolean;
  file: string;
  line: number;
}

export interface McpReference {
  name: string;
  version: string | null;
  description: string | null;
  /** PHP public functions (top-level) */
  functions: McpFunction[];
  /** PHP classes, interfaces, traits */
  classes: McpClass[];
  /** Top-level PHP constants (define()) */
  constants: McpConstant[];
  /** WordPress hooks (actions + filters) */
  hooks: {
    actions: McpHook[];
    filters: McpHook[];
  };
  /** WordPress REST API endpoints */
  restEndpoints: McpRestEndpoint[];
  /** WordPress REST API custom fields registered via register_rest_field() */
  restFields: McpRestField[];
  /** JavaScript functions and classes */
  js: {
    functions: McpJsFunction[];
  };
  /** CSS design tokens */
  cssTokens: McpCssToken[];
}
