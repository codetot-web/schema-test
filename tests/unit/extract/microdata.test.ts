// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { extractMicrodata } from '../../../src/extract/microdata.js';

describe('Microdata Extractor', () => {
  it('extracts a simple Product', () => {
    const html = `
      <div itemscope itemtype="https://schema.org/Product">
        <span itemprop="name">Widget Pro</span>
        <span itemprop="description">A great widget</span>
      </div>
    `;
    const result = extractMicrodata(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.format).toBe('microdata');
    expect(result.blocks[0]!.data['@type']).toBe('Product');
    expect(result.blocks[0]!.data['name']).toBe('Widget Pro');
    expect(result.blocks[0]!.data['description']).toBe('A great widget');
  });

  it('extracts multiple top-level entities', () => {
    const html = `
      <div itemscope itemtype="https://schema.org/Product">
        <span itemprop="name">Widget A</span>
      </div>
      <div itemscope itemtype="https://schema.org/Organization">
        <span itemprop="name">Corp B</span>
      </div>
    `;
    const result = extractMicrodata(html);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0]!.data['@type']).toBe('Product');
    expect(result.blocks[1]!.data['@type']).toBe('Organization');
  });

  it('extracts nested entities', () => {
    const html = `
      <div itemscope itemtype="https://schema.org/Product">
        <span itemprop="name">Widget</span>
        <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
          <span itemprop="price">29.99</span>
          <span itemprop="priceCurrency">USD</span>
        </div>
      </div>
    `;
    const result = extractMicrodata(html);
    expect(result.blocks).toHaveLength(1);
    const product = result.blocks[0]!.data;
    expect(product['@type']).toBe('Product');
    const offers = product['offers'] as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers['price']).toBe('29.99');
  });

  it('extracts link hrefs as property values', () => {
    const html = `
      <div itemscope itemtype="https://schema.org/Product">
        <span itemprop="name">Widget</span>
        <a itemprop="url" href="https://example.com/widget">Link</a>
      </div>
    `;
    const result = extractMicrodata(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.data['url']).toBe('https://example.com/widget');
  });

  it('handles pages with no microdata', () => {
    const html = `<html><body><p>No microdata here</p></body></html>`;
    const result = extractMicrodata(html);
    expect(result.blocks).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('extracts img src as property value', () => {
    const html = `
      <div itemscope itemtype="https://schema.org/Product">
        <span itemprop="name">Widget</span>
        <img itemprop="image" src="https://example.com/widget.jpg" />
      </div>
    `;
    const result = extractMicrodata(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.data['image']).toBe('https://example.com/widget.jpg');
  });

  it('extracts meta content as property value', () => {
    const html = `
      <div itemscope itemtype="https://schema.org/Product">
        <span itemprop="name">Widget</span>
        <meta itemprop="sku" content="WDG-001" />
      </div>
    `;
    const result = extractMicrodata(html);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]!.data['sku']).toBe('WDG-001');
  });
});
