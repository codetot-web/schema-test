// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { validateMarkup } from '../../src/validate/index.js';

describe('RDFa Integration', () => {
  it('validates an RDFa Product end-to-end', () => {
    const html = `
      <html><body>
        <div vocab="https://schema.org/" typeof="Product">
          <span property="name">RDFa Widget</span>
          <span property="description">A widget via RDFa</span>
        </div>
      </body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(true);
    expect(result.entities.length).toBeGreaterThanOrEqual(1);
    const product = result.entities.find(e => e.types.includes('Product'));
    expect(product).toBeDefined();
    expect(product!.format).toBe('rdfa');
    expect(result.summary.formats).toContain('rdfa');
  });

  it('detects unknown types in RDFa', () => {
    const html = `
      <html><body>
        <div vocab="https://schema.org/" typeof="FakeRdfaType">
          <span property="name">Fake</span>
        </div>
      </body></html>
    `;
    const result = validateMarkup(html);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'UNKNOWN_TYPE')).toBe(true);
  });

  it('handles page with no RDFa', () => {
    const html = `<html><body><p>No RDFa</p></body></html>`;
    const result = validateMarkup(html, { formats: ['rdfa'] });
    expect(result.isValid).toBe(true);
    expect(result.entities).toHaveLength(0);
  });
});
