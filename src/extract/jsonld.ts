// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import * as cheerio from 'cheerio';
import type { ExtractedBlock } from '../types.js';
import { IssueCode, type ValidationIssue } from '../types.js';

export interface JsonLdExtractionResult {
  blocks: ExtractedBlock[];
  errors: ValidationIssue[];
}

/**
 * Extract all <script type="application/ld+json"> blocks from HTML.
 * Each block may contain a single object, an array of objects, or an @graph structure.
 */
export function extractJsonLd(html: string): JsonLdExtractionResult {
  const $ = cheerio.load(html);
  const blocks: ExtractedBlock[] = [];
  const errors: ValidationIssue[] = [];

  $('script[type="application/ld+json"]').each((_i, el) => {
    const rawContent = $(el).html();
    if (!rawContent || rawContent.trim().length === 0) return;

    // Strip BOM if present
    const content = rawContent.replace(/^\uFEFF/, '').trim();

    try {
      const parsed: unknown = JSON.parse(content);

      if (Array.isArray(parsed)) {
        // Top-level array: each item is a separate entity
        for (const item of parsed) {
          if (isPlainObject(item)) {
            for (const entity of flattenGraphEntities(item as Record<string, unknown>)) {
              blocks.push({
                format: 'json-ld',
                data: entity,
                rawMarkup: rawContent,
              });
            }
          }
        }
      } else if (isPlainObject(parsed)) {
        const obj = parsed as Record<string, unknown>;
        for (const entity of flattenGraphEntities(obj)) {
          blocks.push({
            format: 'json-ld',
            data: entity,
            rawMarkup: rawContent,
          });
        }
      }
    } catch (e) {
      errors.push({
        severity: 'error',
        code: IssueCode.MALFORMED_JSONLD,
        message: `Invalid JSON in <script type="application/ld+json">: ${(e as Error).message}`,
      });
    }
  });

  return { blocks, errors };
}

/**
 * If object has @graph, flatten to individual entities.
 * Propagates @context from parent to children.
 * Resolves @id cross-references within the graph.
 */
function flattenGraphEntities(obj: Record<string, unknown>): Record<string, unknown>[] {
  const context = obj['@context'];
  const graph = obj['@graph'];

  if (Array.isArray(graph)) {
    const entities = graph
      .filter(isPlainObject)
      .map(item => {
        const entity = item as Record<string, unknown>;
        if (context && !entity['@context']) {
          return { '@context': context, ...entity };
        }
        return { ...entity };
      });

    // Build @id index for cross-reference resolution
    const idIndex = new Map<string, Record<string, unknown>>();
    for (const entity of entities) {
      const id = (entity as Record<string, unknown>)['@id'];
      if (typeof id === 'string') {
        idIndex.set(id, entity);
      }
    }

    // Resolve @id references in all entities
    if (idIndex.size > 0) {
      for (const entity of entities) {
        resolveIdReferences(entity, idIndex, new Set());
      }
    }

    return entities;
  }

  return [obj];
}

/**
 * Recursively resolve {"@id": "..."} references to the actual entity data.
 * This matches how validator.schema.org handles @graph cross-references.
 */
function resolveIdReferences(
  obj: Record<string, unknown>,
  idIndex: Map<string, Record<string, unknown>>,
  visiting: Set<string>,
): void {
  const objId = typeof obj['@id'] === 'string' ? obj['@id'] : undefined;
  if (objId) visiting.add(objId);

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('@')) continue;

    if (isIdReference(value)) {
      const refId = (value as Record<string, unknown>)['@id'] as string;
      const target = idIndex.get(refId);
      if (target && !visiting.has(refId)) {
        obj[key] = target;
      }
    } else if (Array.isArray(value)) {
      obj[key] = value.map(item => {
        if (isIdReference(item)) {
          const refId = (item as Record<string, unknown>)['@id'] as string;
          const target = idIndex.get(refId);
          if (target && !visiting.has(refId)) {
            return target;
          }
        }
        return item;
      });
    } else if (isPlainObject(value) && !isIdReference(value)) {
      resolveIdReferences(value as Record<string, unknown>, idIndex, visiting);
    }
  }

  if (objId) visiting.delete(objId);
}

/**
 * Check if a value is a bare @id reference: {"@id": "..."} with no other keys
 * (or only @id). These are cross-references that need resolution.
 */
function isIdReference(val: unknown): boolean {
  if (!isPlainObject(val)) return false;
  const obj = val as Record<string, unknown>;
  const keys = Object.keys(obj);
  return keys.length === 1 && keys[0] === '@id' && typeof obj['@id'] === 'string';
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
