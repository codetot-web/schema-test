// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { validateMarkup } from '../../src/validate/index.js';

describe('Library Integration', () => {
  it('validates a simple valid Product', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Widget Pro",
          "description": "The best widget",
          "url": "https://example.com/widget"
        }
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]!.types).toEqual(['Product']);
    expect(result.summary.totalEntities).toBe(1);
    expect(result.summary.formats).toEqual(['json-ld']);
    expect(result.errors).toHaveLength(0);
  });

  it('validates Product with nested Offer', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Widget Pro",
          "offers": {
            "@type": "Offer",
            "price": "29.99",
            "priceCurrency": "USD"
          }
        }
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(1);

    const product = result.entities[0]!;
    const offersProperty = product.properties.find(p => p.name === 'offers');
    expect(offersProperty).toBeDefined();
    expect(typeof offersProperty!.value).toBe('object');
  });

  it('detects unknown types as errors', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FooBarBaz",
          "name": "Test"
        }
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'UNKNOWN_TYPE')).toBe(true);
  });

  it('detects unknown properties as errors', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Test",
          "fooProperty": "bar"
        }
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    // Unknown properties are errors (matching SDTT INVALID_PREDICATE behavior)
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'UNKNOWN_PROPERTY')).toBe(true);
  });

  it('handles malformed JSON-LD gracefully', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {invalid json}
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'MALFORMED_JSONLD')).toBe(true);
  });

  it('handles multiple JSON-LD blocks', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Widget"}
        </script>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Organization","name":"Corp"}
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(2);
    expect(result.summary.types).toContain('Product');
    expect(result.summary.types).toContain('Organization');
  });

  it('handles @graph with multiple entities', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            {"@type": "Product", "name": "A"},
            {"@type": "Organization", "name": "B"}
          ]
        }
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(2);
  });

  it('tolerates text where entity expected (SDTT heuristic)', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Test Article",
          "author": "John Doe"
        }
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    // author expects Person/Organization but text is tolerated
    expect(result.isValid).toBe(true);
  });

  it('validates multiple types (Restaurant + BarOrPub)', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": ["Restaurant", "BarOrPub"],
          "name": "Joes Pub"
        }
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities[0]!.types).toEqual(['Restaurant', 'BarOrPub']);
  });

  it('accepts http://schema.org context', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {"@context":"http://schema.org","@type":"Product","name":"Test"}
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
  });

  it('handles page with no structured data', () => {
    const html = `<html><body><p>No structured data here</p></body></html>`;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(0);
    expect(result.summary.totalEntities).toBe(0);
  });

  it('includes timestamp and duration', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Test"}
        </script>
      </head><body></body></html>
    `;
    const result = validateMarkup(html);
    expect(result.timestamp).toBeDefined();
    expect(typeof result.duration).toBe('number');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});
