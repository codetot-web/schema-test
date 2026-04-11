// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { extractJsonLd } from '../../../src/extract/jsonld.js';

describe('JSON-LD Extractor', () => {
  it('extracts a single JSON-LD block', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Widget Pro"
        }
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.data['@type']).toBe('Product');
    expect(result.blocks[0]!.data['name']).toBe('Widget Pro');
    expect(result.errors).toHaveLength(0);
  });

  it('extracts multiple JSON-LD blocks', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"A"}
        </script>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Organization","name":"B"}
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0]!.data['@type']).toBe('Product');
    expect(result.blocks[1]!.data['@type']).toBe('Organization');
  });

  it('handles @graph arrays', () => {
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
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(2);
    // @context should be propagated to graph items
    expect(result.blocks[0]!.data['@context']).toBe('https://schema.org');
    expect(result.blocks[1]!.data['@context']).toBe('https://schema.org');
  });

  it('handles top-level arrays', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        [
          {"@context":"https://schema.org","@type":"Product","name":"A"},
          {"@context":"https://schema.org","@type":"Offer","price":"10"}
        ]
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(2);
  });

  it('reports malformed JSON as error', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {invalid json here}
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.code).toBe('MALFORMED_JSONLD');
  });

  it('one bad block does not prevent extraction of others', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {bad json}
        </script>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Valid"}
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.blocks[0]!.data['name']).toBe('Valid');
  });

  it('handles empty script blocks gracefully', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles nested entities', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Widget",
          "offers": {
            "@type": "Offer",
            "price": "29.99",
            "priceCurrency": "USD"
          }
        }
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(1);
    const offers = result.blocks[0]!.data['offers'] as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers['price']).toBe('29.99');
  });

  it('strips BOM from content', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        \uFEFF{"@context":"https://schema.org","@type":"Product","name":"BOM Test"}
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.data['name']).toBe('BOM Test');
  });

  it('handles http://schema.org context', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
        {"@context":"http://schema.org","@type":"Product","name":"HTTP Context"}
        </script>
      </head><body></body></html>
    `;
    const result = extractJsonLd(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.data['@context']).toBe('http://schema.org');
  });
});
