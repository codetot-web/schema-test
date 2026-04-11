// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import {
  isKnownType,
  isSubTypeOf,
  getValidProperties,
  getAncestorTypes,
  isDeprecatedType,
  stripSchemaPrefix,
} from '../../../src/vocab/types.js';

describe('Type Functions', () => {
  describe('stripSchemaPrefix', () => {
    it('strips https://schema.org/ prefix', () => {
      expect(stripSchemaPrefix('https://schema.org/Product')).toBe('Product');
    });

    it('strips http://schema.org/ prefix', () => {
      expect(stripSchemaPrefix('http://schema.org/Product')).toBe('Product');
    });

    it('strips schema: prefix', () => {
      expect(stripSchemaPrefix('schema:Product')).toBe('Product');
    });

    it('returns bare name unchanged', () => {
      expect(stripSchemaPrefix('Product')).toBe('Product');
    });
  });

  describe('isKnownType', () => {
    it('recognizes common Schema.org types', () => {
      expect(isKnownType('Product')).toBe(true);
      expect(isKnownType('Person')).toBe(true);
      expect(isKnownType('Organization')).toBe(true);
      expect(isKnownType('Article')).toBe(true);
      expect(isKnownType('Event')).toBe(true);
      expect(isKnownType('LocalBusiness')).toBe(true);
      expect(isKnownType('Restaurant')).toBe(true);
    });

    it('handles prefixed type names', () => {
      expect(isKnownType('https://schema.org/Product')).toBe(true);
      expect(isKnownType('http://schema.org/Product')).toBe(true);
    });

    it('rejects unknown types', () => {
      expect(isKnownType('FooBarBaz')).toBe(false);
      expect(isKnownType('NotAType')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(isKnownType('product')).toBe(false);
      expect(isKnownType('PRODUCT')).toBe(false);
    });
  });

  describe('isSubTypeOf', () => {
    it('LocalBusiness is subtype of Organization', () => {
      expect(isSubTypeOf('LocalBusiness', 'Organization')).toBe(true);
    });

    it('LocalBusiness is subtype of Place', () => {
      expect(isSubTypeOf('LocalBusiness', 'Place')).toBe(true);
    });

    it('LocalBusiness is subtype of Thing', () => {
      expect(isSubTypeOf('LocalBusiness', 'Thing')).toBe(true);
    });

    it('Restaurant is subtype of LocalBusiness', () => {
      expect(isSubTypeOf('Restaurant', 'LocalBusiness')).toBe(true);
    });

    it('Restaurant is subtype of Organization (transitive)', () => {
      expect(isSubTypeOf('Restaurant', 'Organization')).toBe(true);
    });

    it('a type is subtype of itself', () => {
      expect(isSubTypeOf('Product', 'Product')).toBe(true);
    });

    it('Organization is NOT subtype of Product', () => {
      expect(isSubTypeOf('Organization', 'Product')).toBe(false);
    });
  });

  describe('getValidProperties', () => {
    it('Product has inherited Thing properties', () => {
      const props = getValidProperties(['Product']);
      expect(props.has('name')).toBe(true);
      expect(props.has('url')).toBe(true);
      expect(props.has('description')).toBe(true);
    });

    it('Product has its own properties', () => {
      const props = getValidProperties(['Product']);
      expect(props.has('offers')).toBe(true);
      expect(props.has('brand')).toBe(true);
    });

    it('multiple types union their properties', () => {
      const props = getValidProperties(['Restaurant', 'BarOrPub']);
      // Both should have LocalBusiness / Organization props
      expect(props.has('name')).toBe(true);
      expect(props.has('menu')).toBe(true);
    });
  });

  describe('getAncestorTypes', () => {
    it('Product has Thing as ancestor', () => {
      const ancestors = getAncestorTypes('Product');
      expect(ancestors).toContain('Thing');
    });

    it('LocalBusiness has multiple ancestors', () => {
      const ancestors = getAncestorTypes('LocalBusiness');
      expect(ancestors).toContain('Organization');
      expect(ancestors).toContain('Place');
      expect(ancestors).toContain('Thing');
    });

    it('Thing has no ancestors', () => {
      const ancestors = getAncestorTypes('Thing');
      expect(ancestors).toHaveLength(0);
    });
  });

  describe('isDeprecatedType', () => {
    it('common types are not deprecated', () => {
      expect(isDeprecatedType('Product')).toBe(false);
      expect(isDeprecatedType('Person')).toBe(false);
    });
  });
});
