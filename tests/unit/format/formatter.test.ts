// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { formatAsText } from '../../../src/format/index.js';
import type { ValidationResult } from '../../../src/types.js';

function makeResult(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    timestamp: '2024-01-15T10:00:00Z',
    duration: 42,
    isValid: true,
    entities: [],
    errors: [],
    warnings: [],
    summary: {
      totalEntities: 0,
      totalTriples: 0,
      types: [],
      formats: [],
      errorCount: 0,
      warningCount: 0,
    },
    ...overrides,
  };
}

describe('Text Formatter', () => {
  it('formats a valid result', () => {
    const result = makeResult({
      url: 'https://example.com',
      entities: [{
        types: ['Product'],
        format: 'json-ld',
        properties: [
          { name: 'name', value: 'Widget', issues: [] },
        ],
        errors: [],
        warnings: [],
      }],
      summary: {
        totalEntities: 1,
        totalTriples: 1,
        types: ['Product'],
        formats: ['json-ld'],
        errorCount: 0,
        warningCount: 0,
      },
    });

    const text = formatAsText(result);
    expect(text).toContain('Schema Validation Report');
    expect(text).toContain('https://example.com');
    expect(text).toContain('Valid');
    expect(text).toContain('Product');
    expect(text).toContain('name');
    expect(text).toContain('"Widget"');
  });

  it('formats an invalid result with errors', () => {
    const result = makeResult({
      isValid: false,
      entities: [{
        types: ['FooType'],
        format: 'json-ld',
        properties: [],
        errors: [{
          severity: 'error',
          code: 'UNKNOWN_TYPE' as never,
          message: 'The type "FooType" is not recognized by Schema.org.',
          type: 'FooType',
        }],
        warnings: [],
      }],
      errors: [{
        severity: 'error',
        code: 'UNKNOWN_TYPE' as never,
        message: 'The type "FooType" is not recognized by Schema.org.',
        type: 'FooType',
      }],
      summary: {
        totalEntities: 1,
        totalTriples: 0,
        types: ['FooType'],
        formats: ['json-ld'],
        errorCount: 1,
        warningCount: 0,
      },
    });

    const text = formatAsText(result);
    expect(text).toContain('Invalid');
    expect(text).toContain('1 errors');
  });

  it('formats empty page result', () => {
    const result = makeResult();
    const text = formatAsText(result);
    expect(text).toContain('Schema Validation Report');
    expect(text).toContain('Valid');
    expect(text).toContain('0 found');
  });

  it('formats nested entity values', () => {
    const result = makeResult({
      entities: [{
        types: ['Product'],
        format: 'json-ld',
        properties: [
          {
            name: 'offers',
            value: {
              types: ['Offer'],
              format: 'json-ld' as const,
              properties: [
                { name: 'price', value: '29.99', issues: [] },
              ],
              errors: [],
              warnings: [],
            },
            issues: [],
          },
        ],
        errors: [],
        warnings: [],
      }],
      summary: {
        totalEntities: 1,
        totalTriples: 2,
        types: ['Product'],
        formats: ['json-ld'],
        errorCount: 0,
        warningCount: 0,
      },
    });

    const text = formatAsText(result);
    expect(text).toContain('offers');
    expect(text).toContain('Offer');
  });
});
