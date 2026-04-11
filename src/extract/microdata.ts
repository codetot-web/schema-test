// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import type { ExtractedBlock, ValidationIssue } from '../types.js';

import * as microdataNode from 'microdata-node';

export interface MicrodataExtractionResult {
  blocks: ExtractedBlock[];
  errors: ValidationIssue[];
}

interface MicrodataItem {
  type: string[];
  properties: Record<string, unknown[]>;
  id?: string;
}

interface MicrodataResult {
  items: MicrodataItem[];
}

/**
 * Extract Microdata (itemscope/itemtype/itemprop) from HTML.
 * Uses microdata-node to parse the DOM and extract structured data.
 */
export function extractMicrodata(html: string): MicrodataExtractionResult {
  const blocks: ExtractedBlock[] = [];
  const errors: ValidationIssue[] = [];

  try {
    const result: MicrodataResult = microdataNode.toJson(html);

    if (!result.items || result.items.length === 0) {
      return { blocks, errors };
    }

    for (const item of result.items) {
      const data = microdataItemToJsonLd(item);
      blocks.push({
        format: 'microdata',
        data,
        rawMarkup: undefined,
      });
    }
  } catch (e) {
    errors.push({
      severity: 'error',
      code: 'MALFORMED_JSONLD' as never, // reuse code for extraction errors
      message: `Microdata extraction failed: ${(e as Error).message}`,
    });
  }

  return { blocks, errors };
}

/**
 * Convert a microdata-node item to a JSON-LD-like structure
 * that the entity builder can process.
 */
function microdataItemToJsonLd(item: MicrodataItem): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Set @type from itemtype
  if (item.type && item.type.length > 0) {
    const types = item.type.map(stripSchemaOrg);
    result['@type'] = types.length === 1 ? types[0] : types;
  }

  // Set @id from itemid
  if (item.id) {
    result['@id'] = item.id;
  }

  // Convert properties
  for (const [key, values] of Object.entries(item.properties)) {
    const propName = stripSchemaOrg(key);
    const converted = values.map(val => {
      // Nested microdata item
      if (typeof val === 'object' && val !== null && 'type' in val && 'properties' in val) {
        return microdataItemToJsonLd(val as MicrodataItem);
      }
      return val;
    });

    result[propName] = converted.length === 1 ? converted[0] : converted;
  }

  return result;
}

function stripSchemaOrg(value: string): string {
  if (value.startsWith('https://schema.org/')) return value.slice(19);
  if (value.startsWith('http://schema.org/')) return value.slice(18);
  return value;
}
