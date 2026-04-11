// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import type { ExtractedBlock, ParsedEntity, SchemaFormat } from '../types.js';

const SCHEMA_IRI = 'https://schema.org/';
const SCHEMA_HTTP_IRI = 'http://schema.org/';
const SCHEMA_PREFIX = 'schema:';

/** Normalize Schema.org context values */
function resolveContext(data: Record<string, unknown>): string | undefined {
  const ctx = data['@context'];
  if (typeof ctx === 'string') return ctx;
  if (typeof ctx === 'object' && ctx !== null && !Array.isArray(ctx)) {
    const vocab = (ctx as Record<string, unknown>)['@vocab'];
    if (typeof vocab === 'string') return vocab;
  }
  if (Array.isArray(ctx)) {
    for (const item of ctx) {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const vocab = (item as Record<string, unknown>)['@vocab'];
        if (typeof vocab === 'string') return vocab;
      }
    }
  }
  return undefined;
}

/** Check if a context URL is a valid Schema.org context */
function isSchemaOrgContext(context: string | undefined): boolean {
  if (!context) return false;
  const normalized = context.replace(/\/$/, '').toLowerCase();
  return normalized === 'https://schema.org' || normalized === 'http://schema.org';
}

/** Strip Schema.org IRI prefix to get bare name */
function stripPrefix(value: string): string {
  if (value.startsWith(SCHEMA_IRI)) return value.slice(SCHEMA_IRI.length);
  if (value.startsWith(SCHEMA_HTTP_IRI)) return value.slice(SCHEMA_HTTP_IRI.length);
  if (value.startsWith(SCHEMA_PREFIX)) return value.slice(SCHEMA_PREFIX.length);
  return value;
}

/** Extract type(s) from @type field */
function extractTypes(data: Record<string, unknown>): string[] {
  const rawType = data['@type'];
  if (!rawType) return [];
  const types = Array.isArray(rawType) ? rawType : [rawType];
  return types
    .filter((t): t is string => typeof t === 'string')
    .map(stripPrefix);
}

/**
 * Build ParsedEntity objects from extracted JSON-LD blocks.
 * Handles nested entities recursively.
 */
export function buildEntities(blocks: ExtractedBlock[]): ParsedEntity[] {
  const entities: ParsedEntity[] = [];

  for (const block of blocks) {
    const entity = buildEntityFromBlock(block.data, block.format);
    if (entity) {
      entities.push(entity);
    }
  }

  return entities;
}

function buildEntityFromBlock(data: Record<string, unknown>, format: SchemaFormat): ParsedEntity | null {
  const types = extractTypes(data);

  // If no type, we still process it (might have type errors to report)
  const properties = new Map<string, unknown[]>();

  for (const [key, value] of Object.entries(data)) {
    // Skip JSON-LD keywords
    if (key.startsWith('@')) continue;

    const propName = stripPrefix(key);
    const values = Array.isArray(value) ? value : [value];
    properties.set(propName, values);
  }

  return {
    types,
    format,
    id: typeof data['@id'] === 'string' ? data['@id'] : undefined,
    properties,
    raw: undefined,
  };
}

/**
 * Check if an extracted block has a valid Schema.org context.
 */
export function hasValidSchemaOrgContext(data: Record<string, unknown>): boolean {
  return isSchemaOrgContext(resolveContext(data));
}
