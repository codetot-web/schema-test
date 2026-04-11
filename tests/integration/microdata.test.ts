// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { validateMarkup } from '../../src/validate/index.js';

describe('Microdata Integration', () => {
  it('validates a Microdata Product end-to-end', () => {
    const html = `
      <html><body>
        <div itemscope itemtype="https://schema.org/Product">
          <span itemprop="name">Microdata Widget</span>
          <span itemprop="description">A widget via Microdata</span>
        </div>
      </body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]!.types).toEqual(['Product']);
    expect(result.entities[0]!.format).toBe('microdata');
    expect(result.summary.formats).toContain('microdata');
  });

  it('validates Microdata with nested Offer', () => {
    const html = `
      <html><body>
        <div itemscope itemtype="https://schema.org/Product">
          <span itemprop="name">Widget</span>
          <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <span itemprop="price">19.99</span>
            <span itemprop="priceCurrency">USD</span>
          </div>
        </div>
      </body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(1);
    const offers = result.entities[0]!.properties.find(p => p.name === 'offers');
    expect(offers).toBeDefined();
  });

  it('detects unknown types in Microdata', () => {
    const html = `
      <html><body>
        <div itemscope itemtype="https://schema.org/FakeType">
          <span itemprop="name">Fake</span>
        </div>
      </body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'UNKNOWN_TYPE')).toBe(true);
  });

  it('validates mixed JSON-LD and Microdata on same page', () => {
    const html = `
      <html>
      <head>
        <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Article","headline":"Test"}
        </script>
      </head>
      <body>
        <div itemscope itemtype="https://schema.org/Organization">
          <span itemprop="name">TestOrg</span>
        </div>
      </body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(2);
    const formats = result.entities.map(e => e.format);
    expect(formats).toContain('json-ld');
    expect(formats).toContain('microdata');
  });
});
