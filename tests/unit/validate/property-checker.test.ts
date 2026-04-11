// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { checkProperty } from '../../../src/validate/property-checker.js';

describe('Property Checker', () => {
  it('accepts valid properties for type', () => {
    const issues = checkProperty('name', ['Product'], 'Product');
    expect(issues).toHaveLength(0);
  });

  it('accepts inherited properties (name on Product via Thing)', () => {
    const issues = checkProperty('name', ['Product'], 'Product');
    expect(issues).toHaveLength(0);
  });

  it('warns on property not valid for type', () => {
    const issues = checkProperty('author', ['Product'], 'Product');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.severity).toBe('error');
    expect(issues[0]!.code).toBe('UNKNOWN_PROPERTY');
  });

  it('warns on completely unknown properties', () => {
    const issues = checkProperty('fooBarBaz', ['Product'], 'Product');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.severity).toBe('error');
    expect(issues[0]!.code).toBe('UNKNOWN_PROPERTY');
  });

  it('accepts properties from any of multiple types', () => {
    // name is valid for Thing (inherited by both Restaurant and Bar)
    const issues = checkProperty('name', ['Restaurant', 'BarOrPub'], 'Restaurant,Bar');
    expect(issues).toHaveLength(0);
  });

  it('skips check when no types (all unknown)', () => {
    const issues = checkProperty('name', [], '');
    expect(issues).toHaveLength(0);
  });
});
