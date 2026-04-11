// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { getPropertyMap } from './loader.js';
import { stripSchemaPrefix, getValidProperties } from './types.js';

/** Check if property exists in Schema.org vocabulary */
export function isKnownProperty(propertyName: string): boolean {
  const bare = stripSchemaPrefix(propertyName);
  return getPropertyMap().has(bare);
}

/** Return rangeIncludes for a property (expected value types) */
export function getExpectedTypes(propertyName: string): string[] {
  const bare = stripSchemaPrefix(propertyName);
  const propDef = getPropertyMap().get(bare);
  return propDef?.rangeIncludes ?? [];
}

/**
 * Check if this property is valid for a type (including inherited).
 * Uses domainIncludes + type hierarchy.
 */
export function isValidPropertyForType(propertyName: string, typeNames: string[]): boolean {
  const bare = stripSchemaPrefix(propertyName);
  const validProps = getValidProperties(typeNames);
  return validProps.has(bare);
}

/** Check if property has supersededBy set */
export function isDeprecatedProperty(propertyName: string): boolean {
  const bare = stripSchemaPrefix(propertyName);
  const propDef = getPropertyMap().get(bare);
  return propDef?.isDeprecated ?? false;
}

/** Get a property definition by name */
export function getPropertyDef(propertyName: string) {
  const bare = stripSchemaPrefix(propertyName);
  return getPropertyMap().get(bare);
}
