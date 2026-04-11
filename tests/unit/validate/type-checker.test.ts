// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { checkTypes } from '../../../src/validate/type-checker.js';

describe('Type Checker', () => {
  it('accepts known Schema.org types', () => {
    const issues = checkTypes(['Product'], 'Product');
    expect(issues).toHaveLength(0);
  });

  it('accepts multiple known types', () => {
    const issues = checkTypes(['Restaurant', 'BarOrPub'], 'Restaurant,Bar');
    expect(issues).toHaveLength(0);
  });

  it('errors on unknown types', () => {
    const issues = checkTypes(['FooBarBaz'], 'FooBarBaz');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe('UNKNOWN_TYPE');
    expect(issues[0]!.severity).toBe('error');
  });

  it('errors on missing type', () => {
    const issues = checkTypes([], '');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe('MISSING_TYPE');
  });

  it('reports each unknown type separately', () => {
    const issues = checkTypes(['Product', 'NotReal'], 'Product,NotReal');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.type).toBe('NotReal');
  });

  it('warns on deprecated types', () => {
    // UserBlocks is superseded by InteractionCounter
    const issues = checkTypes(['UserBlocks'], 'UserBlocks');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.code).toBe('DEPRECATED_TYPE');
    expect(issues[0]!.severity).toBe('warning');
  });

  it('handles mix of valid, unknown, and deprecated types', () => {
    const issues = checkTypes(['Product', 'FakeType', 'UserBlocks'], 'mixed');
    expect(issues).toHaveLength(2);
    const codes = issues.map(i => i.code);
    expect(codes).toContain('UNKNOWN_TYPE');
    expect(codes).toContain('DEPRECATED_TYPE');
  });
});
