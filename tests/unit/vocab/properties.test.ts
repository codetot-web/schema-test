// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import {
  isKnownProperty,
  getExpectedTypes,
  isValidPropertyForType,
  isDeprecatedProperty,
} from '../../../src/vocab/properties.js';

describe('Property Functions', () => {
  describe('isKnownProperty', () => {
    it('recognizes common properties', () => {
      expect(isKnownProperty('name')).toBe(true);
      expect(isKnownProperty('url')).toBe(true);
      expect(isKnownProperty('description')).toBe(true);
      expect(isKnownProperty('author')).toBe(true);
      expect(isKnownProperty('offers')).toBe(true);
    });

    it('rejects unknown properties', () => {
      expect(isKnownProperty('fooBarBaz')).toBe(false);
    });
  });

  describe('getExpectedTypes', () => {
    it('author expects Person or Organization', () => {
      const types = getExpectedTypes('author');
      expect(types).toContain('Person');
      expect(types).toContain('Organization');
    });

    it('name expects Text', () => {
      const types = getExpectedTypes('name');
      expect(types).toContain('Text');
    });

    it('offers expects Offer or Demand', () => {
      const types = getExpectedTypes('offers');
      expect(types).toContain('Offer');
      expect(types).toContain('Demand');
    });

    it('returns empty for unknown properties', () => {
      expect(getExpectedTypes('fooBarBaz')).toEqual([]);
    });
  });

  describe('isValidPropertyForType', () => {
    it('name is valid for Product (inherited from Thing)', () => {
      expect(isValidPropertyForType('name', ['Product'])).toBe(true);
    });

    it('offers is valid for Product', () => {
      expect(isValidPropertyForType('offers', ['Product'])).toBe(true);
    });

    it('author is NOT valid for Product', () => {
      expect(isValidPropertyForType('author', ['Product'])).toBe(false);
    });

    it('author is valid for Article', () => {
      expect(isValidPropertyForType('author', ['Article'])).toBe(true);
    });

    it('name is valid for multiple types including inherited', () => {
      expect(isValidPropertyForType('name', ['Restaurant', 'Bar'])).toBe(true);
    });
  });

  describe('isDeprecatedProperty', () => {
    it('common properties are not deprecated', () => {
      expect(isDeprecatedProperty('name')).toBe(false);
      expect(isDeprecatedProperty('url')).toBe(false);
    });

    it('deprecated properties are flagged', () => {
      // "episodes" is superseded by "episode"
      expect(isDeprecatedProperty('episodes')).toBe(true);
    });
  });
});
