// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

// ── Input ──

export interface ValidateOptions {
  /** Formats to extract. Default: all three */
  formats?: ('json-ld' | 'microdata' | 'rdfa')[];

  /** Follow HTTP redirects. Default: true */
  followRedirects?: boolean;

  /** Render JavaScript before extraction (requires puppeteer as peer dep). Default: false */
  renderJavascript?: boolean;

  /** Fetch timeout in ms. Default: 10000 */
  timeout?: number;

  /** Include raw extracted markup per schema block in results. Default: false */
  includeRaw?: boolean;

  /** Custom HTTP headers for fetching. */
  headers?: Record<string, string>;

  /** HTTP proxy URL for fetching (e.g. http://proxy:8080). */
  proxy?: string;

  /** User-Agent string. Default: "SchemaCraftValidator/x.x.x" */
  userAgent?: string;
}

// ── Output: mirrors validator.schema.org's display structure ──

export interface ValidationResult {
  /** The URL that was validated (undefined for raw markup input) */
  url?: string;

  /** ISO 8601 timestamp of validation */
  timestamp: string;

  /** Total processing time in ms */
  duration: number;

  /** true if zero errors across all entities. Warnings do NOT affect this. */
  isValid: boolean;

  /** Detected entities, grouped the same way validator.schema.org groups them */
  entities: ValidatedEntity[];

  /** All errors across all entities */
  errors: ValidationIssue[];

  /** All warnings across all entities */
  warnings: ValidationIssue[];

  /** High-level summary */
  summary: ValidationSummary;
}

export interface ValidationSummary {
  totalEntities: number;
  totalTriples: number;
  types: string[];
  formats: ('json-ld' | 'microdata' | 'rdfa')[];
  errorCount: number;
  warningCount: number;
}

/**
 * Represents a single Schema.org entity as displayed by validator.schema.org.
 * Maps to one "card" in the validator's output (e.g. "Product", "Organization").
 */
export interface ValidatedEntity {
  /** Schema.org type(s). Can be multiple: ["Restaurant", "Bar"] */
  types: string[];

  /** Format this entity was extracted from */
  format: 'json-ld' | 'microdata' | 'rdfa';

  /** The entity's @id if present */
  id?: string;

  /** Properties with their values and validation status */
  properties: ValidatedProperty[];

  /** Errors specific to this entity (e.g. UNKNOWN_TYPE) */
  errors: ValidationIssue[];

  /** Warnings specific to this entity */
  warnings: ValidationIssue[];

  /** Raw markup for this entity (if includeRaw: true) */
  raw?: string;
}

/**
 * A single property on an entity, matching how validator.schema.org displays it.
 */
export interface ValidatedProperty {
  /** Property name, e.g. "name", "offers", "author" */
  name: string;

  /**
   * The value. Can be:
   * - A string/number/boolean (primitive value)
   * - A ValidatedEntity (nested entity — recursively validated)
   * - An array of the above (multi-valued properties)
   */
  value: PropertyValue;

  /** Whether this specific property-value pair has issues */
  issues: ValidationIssue[];
}

export type PropertyValue =
  | string
  | number
  | boolean
  | ValidatedEntity
  | (string | number | boolean | ValidatedEntity)[];

/**
 * A single validation issue (error or warning).
 */
export interface ValidationIssue {
  /** Error severity */
  severity: 'error' | 'warning';

  /** Machine-readable code for programmatic handling */
  code: IssueCode;

  /** Human-readable message matching SDTT's wording as closely as possible */
  message: string;

  /** Dot-path to the property, e.g. "Product.offers.price" */
  path?: string;

  /** The Schema.org type this issue relates to */
  type?: string;

  /** The property name this issue relates to */
  property?: string;
}

/**
 * Issue codes — modeled after SDTT's actual error/warning categories.
 */
export enum IssueCode {
  // ── Errors ──
  UNKNOWN_TYPE = 'UNKNOWN_TYPE',
  MALFORMED_JSONLD = 'MALFORMED_JSONLD',
  MISSING_CONTEXT = 'MISSING_CONTEXT',
  MISSING_TYPE = 'MISSING_TYPE',
  INVALID_VALUE_TYPE = 'INVALID_VALUE_TYPE',
  INVALID_ENUM_VALUE = 'INVALID_ENUM_VALUE',
  FETCH_ERROR = 'FETCH_ERROR',

  // ── Warnings ──
  UNKNOWN_PROPERTY = 'UNKNOWN_PROPERTY',
  DEPRECATED_TYPE = 'DEPRECATED_TYPE',
  DEPRECATED_PROPERTY = 'DEPRECATED_PROPERTY',
  EMPTY_VALUE = 'EMPTY_VALUE',
  TEXT_FOR_ENTITY = 'TEXT_FOR_ENTITY',
}

// ── Internal types used across pipeline stages ──

export type SchemaFormat = 'json-ld' | 'microdata' | 'rdfa';

export interface ExtractedBlock {
  /** The format this block was extracted from */
  format: SchemaFormat;

  /** Raw data as parsed from markup (before RDF conversion) */
  data: Record<string, unknown>;

  /** Raw markup string (for includeRaw option) */
  rawMarkup?: string;
}

export interface SchemaType {
  id: string;
  label: string;
  comment: string;
  subClassOf: string[];
  isDeprecated: boolean;
  supersededBy?: string;
}

export interface SchemaProperty {
  id: string;
  label: string;
  comment: string;
  domainIncludes: string[];
  rangeIncludes: string[];
  isDeprecated: boolean;
  supersededBy?: string;
}

export interface ParsedEntity {
  types: string[];
  format: SchemaFormat;
  id?: string;
  properties: Map<string, unknown[]>;
  raw?: string;
}
