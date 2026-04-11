// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { getTypeMap, getPropertyMap, getSubtypeTree, getDataTypes } from '../../../src/vocab/loader.js';

describe('Vocabulary Loader', () => {
  it('loads type map with known types', () => {
    const types = getTypeMap();
    expect(types.size).toBeGreaterThan(500);
    expect(types.has('Product')).toBe(true);
    expect(types.has('Person')).toBe(true);
    expect(types.has('Organization')).toBe(true);
    expect(types.has('Thing')).toBe(true);
    expect(types.has('LocalBusiness')).toBe(true);
  });

  it('loads property map with known properties', () => {
    const props = getPropertyMap();
    expect(props.size).toBeGreaterThan(500);
    expect(props.has('name')).toBe(true);
    expect(props.has('url')).toBe(true);
    expect(props.has('description')).toBe(true);
    expect(props.has('offers')).toBe(true);
    expect(props.has('author')).toBe(true);
  });

  it('loads subtype tree', () => {
    const tree = getSubtypeTree();
    expect(tree.size).toBeGreaterThan(500);

    // Product should have Thing as ancestor
    const productAncestors = tree.get('Product');
    expect(productAncestors).toBeDefined();
    expect(productAncestors!.has('Thing')).toBe(true);
  });

  it('loads data types', () => {
    const dataTypes = getDataTypes();
    expect(dataTypes.has('Text')).toBe(true);
    expect(dataTypes.has('Number')).toBe(true);
    expect(dataTypes.has('Boolean')).toBe(true);
    expect(dataTypes.has('Date')).toBe(true);
    expect(dataTypes.has('DateTime')).toBe(true);
    expect(dataTypes.has('URL')).toBe(true);
  });

  it('Product type has correct structure', () => {
    const types = getTypeMap();
    const product = types.get('Product');
    expect(product).toBeDefined();
    expect(product!.label).toBe('Product');
    expect(product!.subClassOf).toContain('Thing');
    expect(product!.isDeprecated).toBe(false);
  });

  it('name property has correct domain and range', () => {
    const props = getPropertyMap();
    const name = props.get('name');
    expect(name).toBeDefined();
    expect(name!.label).toBe('name');
    expect(name!.domainIncludes).toContain('Thing');
    expect(name!.rangeIncludes).toContain('Text');
  });

  it('LocalBusiness has both Organization and Place as ancestors', () => {
    const tree = getSubtypeTree();
    const ancestors = tree.get('LocalBusiness');
    expect(ancestors).toBeDefined();
    expect(ancestors!.has('Organization')).toBe(true);
    expect(ancestors!.has('Place')).toBe(true);
    expect(ancestors!.has('Thing')).toBe(true);
  });
});
