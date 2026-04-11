// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { extractRdfa } from '../../../src/extract/rdfa.js';

describe('RDFa Extractor', () => {
  it('extracts a simple Product', () => {
    const html = `
      <html>
      <body>
        <div vocab="https://schema.org/" typeof="Product">
          <span property="name">Widget Pro</span>
          <span property="description">A great widget</span>
        </div>
      </body>
      </html>
    `;
    const result = extractRdfa(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.format).toBe('rdfa');
    expect(result.blocks[0]!.data['@type']).toBe('Product');
    expect(result.blocks[0]!.data['name']).toBe('Widget Pro');
    expect(result.blocks[0]!.data['description']).toBe('A great widget');
  });

  it('extracts multiple entities', () => {
    const html = `
      <html>
      <body>
        <div vocab="https://schema.org/" typeof="Product">
          <span property="name">Widget</span>
        </div>
        <div vocab="https://schema.org/" typeof="Organization">
          <span property="name">Corp</span>
        </div>
      </body>
      </html>
    `;
    const result = extractRdfa(html);
    expect(result.blocks.length).toBeGreaterThanOrEqual(1);
    const types = result.blocks.map(b => b.data['@type']);
    expect(types).toContain('Product');
  });

  it('handles pages with no RDFa', () => {
    const html = `<html><body><p>No RDFa here</p></body></html>`;
    const result = extractRdfa(html);
    expect(result.blocks).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('extracts nested entities via RDFa', () => {
    const html = `
      <html>
      <body>
        <div vocab="https://schema.org/" typeof="Product">
          <span property="name">Widget</span>
          <div property="offers" typeof="Offer">
            <span property="price">29.99</span>
          </div>
        </div>
      </body>
      </html>
    `;
    const result = extractRdfa(html);
    expect(result.blocks.length).toBeGreaterThanOrEqual(1);
    // The Product entity should exist
    const product = result.blocks.find(b => b.data['@type'] === 'Product');
    expect(product).toBeDefined();
  });
});
