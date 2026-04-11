// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { buildEntities, hasValidSchemaOrgContext } from '../../../src/validate/entity-builder.js';
import type { ExtractedBlock } from '../../../src/types.js';

describe('buildEntities', () => {
  it('builds a single entity from a JSON-LD block with @type Product', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Widget Pro',
          description: 'A fantastic widget',
        },
      },
    ];

    const entities = buildEntities(blocks);

    expect(entities).toHaveLength(1);
    expect(entities[0]!.types).toEqual(['Product']);
    expect(entities[0]!.format).toBe('json-ld');
    expect(entities[0]!.properties.get('name')).toEqual(['Widget Pro']);
    expect(entities[0]!.properties.get('description')).toEqual(['A fantastic widget']);
    expect(entities[0]!.id).toBeUndefined();
  });

  it('builds entities from multiple blocks', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Widget A',
        },
      },
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Acme Corp',
        },
      },
    ];

    const entities = buildEntities(blocks);

    expect(entities).toHaveLength(2);
    expect(entities[0]!.types).toEqual(['Product']);
    expect(entities[1]!.types).toEqual(['Organization']);
    expect(entities[0]!.properties.get('name')).toEqual(['Widget A']);
    expect(entities[1]!.properties.get('name')).toEqual(['Acme Corp']);
  });

  it('builds entity with nested offers inside Product', () => {
    const nestedOffer = {
      '@type': 'Offer',
      price: '29.99',
      priceCurrency: 'USD',
    };

    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Widget Pro',
          offers: nestedOffer,
        },
      },
    ];

    const entities = buildEntities(blocks);

    expect(entities).toHaveLength(1);
    expect(entities[0]!.types).toEqual(['Product']);
    // The nested offer is stored as a raw value in the properties map
    const offersValues = entities[0]!.properties.get('offers');
    expect(offersValues).toHaveLength(1);
    expect(offersValues![0]).toEqual(nestedOffer);
  });

  it('includes @id when present in the block data', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': 'https://example.com/product/1',
          name: 'Widget Pro',
        },
      },
    ];

    const entities = buildEntities(blocks);

    expect(entities).toHaveLength(1);
    expect(entities[0]!.id).toBe('https://example.com/product/1');
  });

  it('handles blocks with missing @type', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          name: 'No Type Entity',
          description: 'An entity without a type',
        },
      },
    ];

    const entities = buildEntities(blocks);

    expect(entities).toHaveLength(1);
    expect(entities[0]!.types).toEqual([]);
    expect(entities[0]!.properties.get('name')).toEqual(['No Type Entity']);
  });

  it('returns empty array for empty blocks input', () => {
    const entities = buildEntities([]);
    expect(entities).toHaveLength(0);
  });

  it('skips JSON-LD keyword properties (@ prefixed keys)', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          '@id': 'https://example.com/product/1',
          name: 'Widget Pro',
        },
      },
    ];

    const entities = buildEntities(blocks);

    expect(entities[0]!.properties.has('@context')).toBe(false);
    expect(entities[0]!.properties.has('@type')).toBe(false);
    expect(entities[0]!.properties.has('@id')).toBe(false);
    expect(entities[0]!.properties.has('name')).toBe(true);
  });

  it('wraps non-array property values in an array', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Widget Pro',
        },
      },
    ];

    const entities = buildEntities(blocks);

    const nameValues = entities[0]!.properties.get('name');
    expect(Array.isArray(nameValues)).toBe(true);
    expect(nameValues).toEqual(['Widget Pro']);
  });

  it('preserves array property values as-is', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: ['Widget Pro', 'Widget Pro XL'],
        },
      },
    ];

    const entities = buildEntities(blocks);

    const nameValues = entities[0]!.properties.get('name');
    expect(nameValues).toEqual(['Widget Pro', 'Widget Pro XL']);
  });

  it('strips schema.org IRI prefix from property names', () => {
    const blocks: ExtractedBlock[] = [
      {
        format: 'json-ld',
        data: {
          '@context': 'https://schema.org',
          '@type': 'Product',
          'https://schema.org/name': 'Widget Pro',
        },
      },
    ];

    const entities = buildEntities(blocks);

    expect(entities[0]!.properties.has('name')).toBe(true);
    expect(entities[0]!.properties.has('https://schema.org/name')).toBe(false);
  });
});

describe('hasValidSchemaOrgContext', () => {
  it('accepts https://schema.org string context', () => {
    expect(hasValidSchemaOrgContext({ '@context': 'https://schema.org' })).toBe(true);
  });

  it('accepts http://schema.org string context', () => {
    expect(hasValidSchemaOrgContext({ '@context': 'http://schema.org' })).toBe(true);
  });

  it('accepts https://schema.org/ with trailing slash', () => {
    expect(hasValidSchemaOrgContext({ '@context': 'https://schema.org/' })).toBe(true);
  });

  it('accepts object context with @vocab set to https://schema.org/', () => {
    expect(
      hasValidSchemaOrgContext({ '@context': { '@vocab': 'https://schema.org/' } }),
    ).toBe(true);
  });

  it('rejects missing context', () => {
    expect(hasValidSchemaOrgContext({ '@type': 'Product' })).toBe(false);
  });

  it('rejects unrelated context string', () => {
    expect(hasValidSchemaOrgContext({ '@context': 'https://example.com' })).toBe(false);
  });

  it('rejects null context', () => {
    expect(hasValidSchemaOrgContext({ '@context': null as unknown as string })).toBe(false);
  });

  it('accepts array context containing https://schema.org', () => {
    expect(
      hasValidSchemaOrgContext({ '@context': ['https://schema.org', { name: 'name' }] }),
    ).toBe(true);
  });
});
