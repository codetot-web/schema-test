// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import {
  IssueCode,
  type ValidateOptions,
  type ValidationResult,
  type ValidatedEntity,
  type ValidatedProperty,
  type ValidationIssue,
  type SchemaFormat,
} from '../types.js';
import { extractAll } from '../extract/index.js';
import { buildEntities } from './entity-builder.js';
import { checkTypes } from './type-checker.js';
import { checkProperty } from './property-checker.js';
import { isKnownType } from '../vocab/types.js';
import { checkValue } from './value-checker.js';
import { fetchUrl } from '../fetch/http.js';

/**
 * Validate structured data from a URL.
 */
export async function validate(
  url: string,
  options?: ValidateOptions,
): Promise<ValidationResult> {
  const startTime = Date.now();

  const html = await fetchUrl(url, options);
  const result = validateHtml(html, options?.formats);

  return {
    ...result,
    url,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate structured data from raw HTML markup.
 */
export function validateMarkup(
  html: string,
  options?: ValidateOptions,
): ValidationResult {
  const startTime = Date.now();
  const result = validateHtml(html, options?.formats);

  return {
    ...result,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate raw JSON-LD input (string or object) — no HTML wrapper needed.
 * Accepts the same input you'd paste into validator.schema.org's code snippet box.
 */
export function validateJsonLd(
  input: string | Record<string, unknown>,
  options?: ValidateOptions,
): ValidationResult {
  const startTime = Date.now();

  let data: unknown;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch (e) {
      return {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        isValid: false,
        entities: [],
        errors: [{
          severity: 'error',
          code: IssueCode.MALFORMED_JSONLD,
          message: `Invalid JSON: ${(e as Error).message}`,
        }],
        warnings: [],
        summary: {
          totalEntities: 0,
          totalTriples: 0,
          types: [],
          formats: [],
          errorCount: 1,
          warningCount: 0,
        },
      };
    }
  } else {
    data = input;
  }

  // Wrap in a minimal HTML page so the existing pipeline handles it
  const json = JSON.stringify(data);
  const html = `<html><head><script type="application/ld+json">${json}</script></head><body></body></html>`;
  const result = validateHtml(html, options?.formats ?? ['json-ld']);

  return {
    ...result,
    duration: Date.now() - startTime,
  };
}

/**
 * Validate structured data from multiple URLs.
 */
export async function validateBatch(
  urls: string[],
  options?: ValidateOptions,
): Promise<ValidationResult[]> {
  return Promise.all(urls.map(url => validate(url, options)));
}

/**
 * Core validation pipeline: extract → build entities → validate → format.
 */
function validateHtml(html: string, formats?: SchemaFormat[]): ValidationResult {
  // Step 1: Extract structured data from HTML
  const extraction = extractAll(html, formats);

  // Step 2: Build entity objects from extracted blocks
  const parsedEntities = buildEntities(extraction.blocks);

  // Step 3: Validate each entity
  const validatedEntities: ValidatedEntity[] = [];
  const allErrors: ValidationIssue[] = [...extraction.errors];
  const allWarnings: ValidationIssue[] = [];
  const formatsFound = new Set<SchemaFormat>();
  const typesFound = new Set<string>();

  // Track validated entity @ids to avoid duplicate error counting
  // when the same entity appears as both a top-level @graph item
  // and a nested @id reference
  const sharedVisited = new Set<unknown>();
  const validatedIds = new Set<string>();
  const validatedByIdCache = new Map<string, ValidatedEntity>();

  for (const entity of parsedEntities) {
    // Skip if this entity was already fully validated via @id resolution
    // from a parent entity processed earlier in the loop
    if (entity.id && (validatedIds.has(entity.id) || sharedVisited.has(entity.id))) {
      const cached = validatedByIdCache.get(entity.id);
      if (cached) {
        validatedEntities.push(cached);
        formatsFound.add(entity.format);
        for (const t of entity.types) typesFound.add(t);
        // Don't re-add errors/warnings — already counted
      }
      continue;
    }

    const validated = validateEntity(entity.types, entity.format, entity.properties, entity.id, undefined, sharedVisited);
    validatedEntities.push(validated);

    if (entity.id) {
      validatedIds.add(entity.id);
      validatedByIdCache.set(entity.id, validated);
    }

    formatsFound.add(entity.format);
    for (const t of entity.types) typesFound.add(t);

    for (const issue of validated.errors) allErrors.push(issue);
    for (const issue of validated.warnings) allWarnings.push(issue);
  }

  return {
    timestamp: new Date().toISOString(),
    duration: 0,
    isValid: allErrors.length === 0,
    entities: validatedEntities,
    errors: allErrors,
    warnings: allWarnings,
    summary: {
      totalEntities: validatedEntities.length,
      totalTriples: countTriples(validatedEntities),
      types: [...typesFound],
      formats: [...formatsFound],
      errorCount: allErrors.length,
      warningCount: allWarnings.length,
    },
  };
}

function validateEntity(
  types: string[],
  format: SchemaFormat,
  properties: Map<string, unknown[]>,
  id?: string,
  path?: string,
  visited?: Set<unknown>,
): ValidatedEntity {
  const entityPath = path ?? (types.join(',') || 'UnknownType');
  const entityErrors: ValidationIssue[] = [];
  const entityWarnings: ValidationIssue[] = [];
  const validatedProps: ValidatedProperty[] = [];
  const visitedSet = visited ?? new Set();

  // Type checking
  const typeIssues = checkTypes(types, entityPath);
  for (const issue of typeIssues) {
    if (issue.severity === 'error') entityErrors.push(issue);
    else entityWarnings.push(issue);
  }

  // Only use known types for property checking — skip if all types are unknown
  const knownTypes = types.filter(t => isKnownType(t));

  // Property checking
  for (const [propName, values] of properties) {
    const propIssues: ValidationIssue[] = [];

    // Check if property is valid for this type
    const propCheckIssues = checkProperty(propName, knownTypes, entityPath);
    propIssues.push(...propCheckIssues);

    // Check each value
    const resolvedValues: (string | number | boolean | ValidatedEntity)[] = [];

    for (const val of values) {
      // Nested entity
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const nested = val as Record<string, unknown>;

        // Always check value type (e.g., makesOffer expects Offer, got Product)
        // even if this entity was already validated elsewhere
        const nestedValueIssues = checkValue(propName, nested, entityPath);
        propIssues.push(...nestedValueIssues);

        // Check by both object reference and @id string
        const nestedIdStr = typeof nested['@id'] === 'string' ? nested['@id'] as string : undefined;
        if (visitedSet.has(nested) || (nestedIdStr && visitedSet.has(nestedIdStr))) {
          // Already validated this entity — skip recursive validation
          // but keep the value type check above (it's per-property, not per-entity)
          resolvedValues.push('[Circular Reference]');
          continue;
        }
        visitedSet.add(nested);
        if (nestedIdStr) visitedSet.add(nestedIdStr);

        const nestedTypes = extractTypesFromValue(nested);
        const nestedProperties = new Map<string, unknown[]>();
        for (const [k, v] of Object.entries(nested)) {
          if (k.startsWith('@')) continue;
          const bareKey = stripSchemaPrefix(k);
          nestedProperties.set(bareKey, Array.isArray(v) ? v : [v]);
        }

        const nestedId = typeof nested['@id'] === 'string' ? (nested['@id'] as string) : undefined;
        const nestedEntity = validateEntity(
          nestedTypes,
          format,
          nestedProperties,
          nestedId,
          `${entityPath}.${propName}`,
          visitedSet,
        );

        resolvedValues.push(nestedEntity);

        // Propagate nested errors/warnings
        entityErrors.push(...nestedEntity.errors);
        entityWarnings.push(...nestedEntity.warnings);
      } else {
        // Primitive value
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          resolvedValues.push(val);
        } else {
          resolvedValues.push(String(val));
        }

        // Value type checking
        const valueIssues = checkValue(propName, val, entityPath);
        propIssues.push(...valueIssues);
      }
    }

    // Categorize property issues
    for (const issue of propIssues) {
      if (issue.severity === 'error') entityErrors.push(issue);
      else entityWarnings.push(issue);
    }

    validatedProps.push({
      name: propName,
      value: resolvedValues.length === 1 ? resolvedValues[0]! : resolvedValues,
      issues: propIssues,
    });
  }

  return {
    types,
    format,
    id,
    properties: validatedProps,
    errors: entityErrors,
    warnings: entityWarnings,
  };
}

function extractTypesFromValue(obj: Record<string, unknown>): string[] {
  const rawType = obj['@type'];
  if (!rawType) return [];
  const types = Array.isArray(rawType) ? rawType : [rawType];
  return types
    .filter((t): t is string => typeof t === 'string')
    .map(stripSchemaPrefix);
}

function stripSchemaPrefix(name: string): string {
  if (name.startsWith('https://schema.org/')) return name.slice(19);
  if (name.startsWith('http://schema.org/')) return name.slice(18);
  if (name.startsWith('schema:')) return name.slice(7);
  return name;
}

function countTriples(entities: ValidatedEntity[]): number {
  let count = 0;
  for (const entity of entities) {
    count += entity.properties.length;
    for (const prop of entity.properties) {
      if (Array.isArray(prop.value)) {
        for (const v of prop.value) {
          if (typeof v === 'object' && v !== null) {
            count += countTriples([v as ValidatedEntity]);
          }
        }
      } else if (typeof prop.value === 'object' && prop.value !== null) {
        count += countTriples([prop.value as ValidatedEntity]);
      }
    }
  }
  return count;
}
