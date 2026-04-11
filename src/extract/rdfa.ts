// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import type { ExtractedBlock, ValidationIssue } from '../types.js';

export interface RdfaExtractionResult {
  blocks: ExtractedBlock[];
  errors: ValidationIssue[];
}

interface RdfQuad {
  subject: { value: string; termType: string };
  predicate: { value: string };
  object: { value: string; termType: string; datatype?: { value: string } };
}

const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const SCHEMA_ORG = 'https://schema.org/';
const RDFA_USES_VOCAB = 'http://www.w3.org/ns/rdfa#usesVocabulary';

/**
 * Extract RDFa (typeof/property/vocab) from HTML.
 * Uses rdfa-streaming-parser to parse quads, then rebuilds entity structures.
 */
export function extractRdfa(html: string): RdfaExtractionResult {
  const blocks: ExtractedBlock[] = [];
  const errors: ValidationIssue[] = [];

  try {
    // Dynamic import to handle the streaming parser
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RdfaParser } = require('rdfa-streaming-parser');

    const quads: RdfQuad[] = [];
    const parser = new RdfaParser({
      baseIRI: 'http://example.com/',
      contentType: 'text/html',
    });

    // Collect quads synchronously (the parser emits them during write/end)
    parser.on('data', (quad: RdfQuad) => {
      quads.push(quad);
    });

    parser.on('error', (e: Error) => {
      errors.push({
        severity: 'error',
        code: 'MALFORMED_JSONLD' as never,
        message: `RDFa parsing error: ${e.message}`,
      });
    });

    parser.write(html);
    parser.end();

    // Group quads by subject to build entities
    const entityMap = new Map<string, Record<string, unknown>>();

    for (const quad of quads) {
      // Skip rdfa:usesVocabulary triples
      if (quad.predicate.value === RDFA_USES_VOCAB) continue;

      const subjectId = quad.subject.value;

      if (!entityMap.has(subjectId)) {
        entityMap.set(subjectId, {});
      }
      const entity = entityMap.get(subjectId)!;

      if (quad.predicate.value === RDF_TYPE) {
        // Type assertion
        const typeName = stripSchemaOrg(quad.object.value);
        const existing = entity['@type'];
        if (Array.isArray(existing)) {
          (existing as string[]).push(typeName);
        } else if (typeof existing === 'string') {
          entity['@type'] = [existing, typeName];
        } else {
          entity['@type'] = typeName;
        }
      } else if (quad.predicate.value.startsWith(SCHEMA_ORG)) {
        // Schema.org property
        const propName = quad.predicate.value.slice(SCHEMA_ORG.length);
        const value = quad.object.value;

        // Check if value is another entity (blank node or URI with type)
        if (quad.object.termType === 'BlankNode' || quad.object.termType === 'NamedNode') {
          // Could be a nested entity — will be resolved below
          const existing = entity[propName];
          if (existing !== undefined) {
            if (Array.isArray(existing)) {
              (existing as unknown[]).push(value);
            } else {
              entity[propName] = [existing, value];
            }
          } else {
            entity[propName] = value;
          }
        } else {
          // Literal value
          const existing = entity[propName];
          if (existing !== undefined) {
            if (Array.isArray(existing)) {
              (existing as unknown[]).push(value);
            } else {
              entity[propName] = [existing, value];
            }
          } else {
            entity[propName] = value;
          }
        }
      }
    }

    // Convert to blocks — only entities with @type
    for (const [id, entity] of entityMap) {
      if (!entity['@type']) continue;

      // Set @id for non-blank nodes
      if (!id.startsWith('_:')) {
        entity['@id'] = id;
      }

      // Resolve nested entity references
      resolveNestedEntities(entity, entityMap);

      blocks.push({
        format: 'rdfa',
        data: entity,
        rawMarkup: undefined,
      });
    }
  } catch (e) {
    errors.push({
      severity: 'error',
      code: 'MALFORMED_JSONLD' as never,
      message: `RDFa extraction failed: ${(e as Error).message}`,
    });
  }

  return { blocks, errors };
}

/**
 * Resolve property values that reference other entities by ID.
 */
function resolveNestedEntities(
  entity: Record<string, unknown>,
  entityMap: Map<string, Record<string, unknown>>,
): void {
  for (const [key, value] of Object.entries(entity)) {
    if (key.startsWith('@')) continue;

    if (typeof value === 'string' && entityMap.has(value) && value !== entity['@id']) {
      const nested = entityMap.get(value)!;
      if (nested['@type']) {
        entity[key] = nested;
      }
    } else if (Array.isArray(value)) {
      entity[key] = value.map(v => {
        if (typeof v === 'string' && entityMap.has(v) && v !== entity['@id']) {
          const nested = entityMap.get(v)!;
          if (nested['@type']) return nested;
        }
        return v;
      });
    }
  }
}

function stripSchemaOrg(value: string): string {
  if (value.startsWith('https://schema.org/')) return value.slice(19);
  if (value.startsWith('http://schema.org/')) return value.slice(18);
  return value;
}
