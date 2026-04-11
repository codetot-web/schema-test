// Copyright 2026 Abdo Elbradey
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
 */
function flattenGraphEntities(obj: Record<string, unknown>): Record<string, unknown>[] {
  const context = obj['@context'];
  const graph = obj['@graph'];

  if (Array.isArray(graph)) {
    return graph
      .filter(isPlainObject)
      .map(item => {
        const entity = item as Record<string, unknown>;
        // Propagate @context to graph items if not already present
        if (context && !entity['@context']) {
          return { '@context': context, ...entity };
        }
        return entity;
      });
  }

  return [obj];
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
