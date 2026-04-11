// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import type { ValidationIssue } from '../types.js';
import { IssueCode } from '../types.js';
import { getExpectedTypes } from '../vocab/properties.js';
import { isKnownType, isSubTypeOf, stripSchemaPrefix } from '../vocab/types.js';
import { getDataTypes } from '../vocab/loader.js';

/**
 * Check if a property value matches expected types.
 * Implements SDTT heuristics: text-for-entity is tolerated, etc.
 */
export function checkValue(
  propertyName: string,
  value: unknown,
  entityPath: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expectedTypes = getExpectedTypes(propertyName);

  if (expectedTypes.length === 0) return issues;

  // Empty value check
  if (value === '' || value === null || value === undefined) {
    issues.push({
      severity: 'warning',
      code: IssueCode.EMPTY_VALUE,
      message: `The property "${propertyName}" has an empty value.`,
      path: `${entityPath}.${propertyName}`,
      property: propertyName,
    });
    return issues;
  }

  const dataTypes = getDataTypes();

  // Check if any expected type is a data type (Text, Number, Boolean, etc.)
  const expectsDataType = expectedTypes.some(t => dataTypes.has(t));
  // Check if any expected type is a Schema.org class (Person, Organization, etc.)
  const expectsEntity = expectedTypes.some(t => isKnownType(t) && !dataTypes.has(t));

  if (typeof value === 'string') {
    // Text-for-entity heuristic: if expected type is an entity but got text, TOLERATE
    // This matches SDTT behavior — "it's fine to include just regular text or a URL"
    if (expectsEntity && !expectsDataType) {
      // Don't flag this — SDTT tolerates it
      return issues;
    }

    // String value for Text, URL: always valid
    if (expectedTypes.includes('Text') || expectedTypes.includes('URL')) {
      return issues;
    }

    // String-for-number heuristic
    if (expectedTypes.includes('Number') || expectedTypes.includes('Integer') || expectedTypes.includes('Float')) {
      if (!isNaN(Number(value))) return issues;
    }

    // String-for-boolean heuristic
    if (expectedTypes.includes('Boolean')) {
      if (value === 'true' || value === 'false' || value === 'True' || value === 'False') {
        return issues;
      }
    }

    // Date/DateTime/Time validation
    if (expectedTypes.includes('Date') || expectedTypes.includes('DateTime') || expectedTypes.includes('Time')) {
      return issues; // Accept any string for dates (SDTT is lenient)
    }

    return issues;
  }

  if (typeof value === 'number') {
    if (expectedTypes.includes('Number') || expectedTypes.includes('Integer') || expectedTypes.includes('Float') || expectedTypes.includes('Text')) {
      return issues;
    }
  }

  if (typeof value === 'boolean') {
    if (expectedTypes.includes('Boolean') || expectedTypes.includes('Text')) {
      return issues;
    }
  }

  // Nested entity (object with @type)
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const nestedType = (value as Record<string, unknown>)['@type'];
    if (nestedType) {
      const nestedTypes = Array.isArray(nestedType) ? nestedType : [nestedType];
      for (const nt of nestedTypes) {
        if (typeof nt !== 'string') continue;
        const bare = stripSchemaPrefix(nt);
        // Check if nested type matches any expected type (including subtypes)
        const matches = expectedTypes.some(expected =>
          isSubTypeOf(bare, expected)
        );
        if (matches) return issues;
      }
      // Nested entity type doesn't match expected types
      // SDTT may or may not flag this — be lenient for now
    }
    return issues;
  }

  return issues;
}
