// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { checkValue } from '../../../src/validate/value-checker.js';

describe('Value Checker', () => {
  it('accepts text value for name property', () => {
    const issues = checkValue('name', 'Widget Pro', 'Product');
    expect(issues).toHaveLength(0);
  });

  it('tolerates text where entity expected (author)', () => {
    // SDTT heuristic: text-for-entity is tolerated
    const issues = checkValue('author', 'John Doe', 'Article');
    expect(issues).toHaveLength(0);
  });

  it('warns on empty values', () => {
    const issues = checkValue('name', '', 'Product');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe('EMPTY_VALUE');
  });

  it('accepts numeric string for number properties', () => {
    const issues = checkValue('price', '29.99', 'Offer');
    expect(issues).toHaveLength(0);
  });

  it('accepts boolean string for boolean properties', () => {
    // isAccessibleForFree expects Boolean
    const issues = checkValue('isAccessibleForFree', 'true', 'Article');
    expect(issues).toHaveLength(0);
  });

  it('accepts URL string for url property', () => {
    const issues = checkValue('url', 'https://example.com', 'Product');
    expect(issues).toHaveLength(0);
  });

  it('accepts nested entity with matching type', () => {
    const issues = checkValue('offers', { '@type': 'Offer', price: '10' }, 'Product');
    expect(issues).toHaveLength(0);
  });

  it('accepts nested entity with subtype', () => {
    const issues = checkValue('author', { '@type': 'Person', name: 'Jane' }, 'Article');
    expect(issues).toHaveLength(0);
  });

  it('accepts number value for number properties', () => {
    const issues = checkValue('price', 29.99, 'Offer');
    expect(issues).toHaveLength(0);
  });

  it('accepts boolean value for boolean properties', () => {
    const issues = checkValue('isAccessibleForFree', true, 'Article');
    expect(issues).toHaveLength(0);
  });

  it('handles null value as empty', () => {
    const issues = checkValue('name', null, 'Product');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe('EMPTY_VALUE');
  });

  it('handles undefined value as empty', () => {
    const issues = checkValue('name', undefined, 'Product');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe('EMPTY_VALUE');
  });

  it('returns no issues for unknown properties', () => {
    const issues = checkValue('fakeProperty', 'value', 'Product');
    expect(issues).toHaveLength(0);
  });

  it('accepts date strings for date properties', () => {
    const issues = checkValue('startDate', '2024-06-15', 'Event');
    expect(issues).toHaveLength(0);
  });

  it('accepts nested entity with multiple types', () => {
    const issues = checkValue('author', { '@type': ['Person', 'Organization'], name: 'Both' }, 'Article');
    expect(issues).toHaveLength(0);
  });

  it('accepts URL string where entity expected', () => {
    const issues = checkValue('author', 'https://example.com/person/1', 'Article');
    expect(issues).toHaveLength(0);
  });

  it('accepts nested entity without @type', () => {
    const issues = checkValue('offers', { price: '10' }, 'Product');
    expect(issues).toHaveLength(0);
  });
});
