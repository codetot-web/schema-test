// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { extractAll } from '../../../src/extract/index.js';

const JSON_LD_ONLY_HTML = `
<html>
  <head>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Widget Pro"
    }
    </script>
  </head>
  <body></body>
</html>
`;

const MICRODATA_ONLY_HTML = `
<html>
  <body>
    <div itemscope itemtype="https://schema.org/Product">
      <span itemprop="name">Microdata Widget</span>
      <span itemprop="description">A widget described with microdata</span>
    </div>
  </body>
</html>
`;

const BOTH_HTML = `
<html>
  <head>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Acme Corp"
    }
    </script>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/Product">
      <span itemprop="name">Microdata Widget</span>
    </div>
  </body>
</html>
`;

describe('extractAll', () => {
  it('extracts JSON-LD blocks from HTML containing only JSON-LD', () => {
    const result = extractAll(JSON_LD_ONLY_HTML);

    expect(result.errors).toHaveLength(0);
    const jsonLdBlocks = result.blocks.filter(b => b.format === 'json-ld');
    expect(jsonLdBlocks).toHaveLength(1);
    expect(jsonLdBlocks[0]!.data['@type']).toBe('Product');
    expect(jsonLdBlocks[0]!.data['name']).toBe('Widget Pro');
  });

  it('extracts Microdata blocks from HTML containing only Microdata', () => {
    const result = extractAll(MICRODATA_ONLY_HTML);

    expect(result.errors).toHaveLength(0);
    const microdataBlocks = result.blocks.filter(b => b.format === 'microdata');
    expect(microdataBlocks).toHaveLength(1);
    expect(microdataBlocks[0]!.data['@type']).toBe('Product');
  });

  it('extracts both JSON-LD and Microdata from HTML containing both', () => {
    const result = extractAll(BOTH_HTML);

    expect(result.errors).toHaveLength(0);
    const jsonLdBlocks = result.blocks.filter(b => b.format === 'json-ld');
    const microdataBlocks = result.blocks.filter(b => b.format === 'microdata');
    expect(jsonLdBlocks).toHaveLength(1);
    expect(microdataBlocks).toHaveLength(1);
    expect(jsonLdBlocks[0]!.data['@type']).toBe('Organization');
    expect(microdataBlocks[0]!.data['@type']).toBe('Product');
  });

  it('filters to only json-ld when format filter is [json-ld]', () => {
    const result = extractAll(BOTH_HTML, ['json-ld']);

    const jsonLdBlocks = result.blocks.filter(b => b.format === 'json-ld');
    const microdataBlocks = result.blocks.filter(b => b.format === 'microdata');
    const rdfaBlocks = result.blocks.filter(b => b.format === 'rdfa');

    expect(jsonLdBlocks).toHaveLength(1);
    expect(microdataBlocks).toHaveLength(0);
    expect(rdfaBlocks).toHaveLength(0);
  });

  it('filters to only microdata when format filter is [microdata]', () => {
    const result = extractAll(BOTH_HTML, ['microdata']);

    const jsonLdBlocks = result.blocks.filter(b => b.format === 'json-ld');
    const microdataBlocks = result.blocks.filter(b => b.format === 'microdata');
    const rdfaBlocks = result.blocks.filter(b => b.format === 'rdfa');

    expect(jsonLdBlocks).toHaveLength(0);
    expect(microdataBlocks).toHaveLength(1);
    expect(rdfaBlocks).toHaveLength(0);
  });

  it('filters to only rdfa when format filter is [rdfa]', () => {
    // Use HTML with RDFa markup
    const rdfaHtml = `
      <html>
        <head>
          <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Product","name":"JSON-LD Widget"}
          </script>
        </head>
        <body>
          <div vocab="https://schema.org/" typeof="Organization">
            <span property="name">RDFa Corp</span>
          </div>
          <div itemscope itemtype="https://schema.org/Product">
            <span itemprop="name">Microdata Widget</span>
          </div>
        </body>
      </html>
    `;
    const result = extractAll(rdfaHtml, ['rdfa']);

    const jsonLdBlocks = result.blocks.filter(b => b.format === 'json-ld');
    const microdataBlocks = result.blocks.filter(b => b.format === 'microdata');

    expect(jsonLdBlocks).toHaveLength(0);
    expect(microdataBlocks).toHaveLength(0);
    // rdfa blocks may or may not be found depending on parser, but no other formats
  });

  it('returns empty blocks and no errors for empty HTML', () => {
    const result = extractAll('');

    expect(result.blocks).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('returns empty blocks and no errors for HTML with no structured data', () => {
    const result = extractAll('<html><body><p>Hello world</p></body></html>');

    expect(result.blocks).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('reports errors from malformed JSON-LD without crashing', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">{bad json}</script>
        </head>
        <body></body>
      </html>
    `;
    const result = extractAll(html);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.code).toBe('MALFORMED_JSONLD');
    expect(result.blocks).toHaveLength(0);
  });

  it('combines blocks from multiple JSON-LD scripts and microdata in one pass', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Product","name":"A"}
          </script>
          <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Article","name":"B"}
          </script>
        </head>
        <body>
          <div itemscope itemtype="https://schema.org/Organization">
            <span itemprop="name">Org C</span>
          </div>
        </body>
      </html>
    `;
    const result = extractAll(html);

    const jsonLdBlocks = result.blocks.filter(b => b.format === 'json-ld');
    const microdataBlocks = result.blocks.filter(b => b.format === 'microdata');

    expect(jsonLdBlocks).toHaveLength(2);
    expect(microdataBlocks).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('uses all formats when no filter is provided', () => {
    const result = extractAll(JSON_LD_ONLY_HTML);
    // Should not restrict; JSON-LD block should appear
    expect(result.blocks.some(b => b.format === 'json-ld')).toBe(true);
  });
});
