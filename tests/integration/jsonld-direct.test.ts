// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { validateJsonLd } from '../../src/validate/index.js';

describe('validateJsonLd', () => {
  it('validates a JSON-LD string', () => {
    const jsonld = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'Widget Pro',
      'offers': {
        '@type': 'Offer',
        'price': '29.99',
        'priceCurrency': 'USD',
      },
    });

    const result = validateJsonLd(jsonld);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]!.types).toEqual(['Product']);
  });

  it('validates a JSON-LD object directly', () => {
    const result = validateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': 'Jane Doe',
      'jobTitle': 'Engineer',
    });

    expect(result.isValid).toBe(true);
    expect(result.entities[0]!.types).toEqual(['Person']);
  });

  it('handles @graph in raw JSON-LD', () => {
    const result = validateJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Product', 'name': 'A' },
        { '@type': 'Organization', 'name': 'B' },
      ],
    });

    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(2);
  });

  it('reports malformed JSON string', () => {
    const result = validateJsonLd('{invalid json}');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]!.code).toBe('MALFORMED_JSONLD');
  });

  it('detects unknown types', () => {
    const result = validateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'FakeType',
      'name': 'test',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'UNKNOWN_TYPE')).toBe(true);
  });

  it('tolerates text where entity expected', () => {
    const result = validateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'Test',
      'author': 'John Doe',
    });

    expect(result.isValid).toBe(true);
  });

  it('includes duration', () => {
    const result = validateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      'name': 'Test',
    });

    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});
