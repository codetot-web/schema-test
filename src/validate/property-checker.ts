// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { IssueCode, type ValidationIssue } from '../types.js';
import { getValidProperties } from '../vocab/types.js';
import { isKnownProperty, isDeprecatedProperty } from '../vocab/properties.js';

/**
 * Check if a property is valid for the given type(s).
 * Unknown properties trigger warnings (not errors), matching SDTT behavior.
 */
export function checkProperty(
  propertyName: string,
  entityTypes: string[],
  entityPath: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // If we have no valid types (all unknown), skip property checking
  if (entityTypes.length === 0) return issues;

  const validProps = getValidProperties(entityTypes);

  if (!validProps.has(propertyName)) {
    if (!isKnownProperty(propertyName)) {
      issues.push({
        severity: 'warning',
        code: IssueCode.UNKNOWN_PROPERTY,
        message: `The property "${propertyName}" is not recognized by Schema.org.`,
        path: `${entityPath}.${propertyName}`,
        property: propertyName,
      });
    } else {
      issues.push({
        severity: 'warning',
        code: IssueCode.UNKNOWN_PROPERTY,
        message: `The property "${propertyName}" is not expected on type ${entityTypes.join(', ')}.`,
        path: `${entityPath}.${propertyName}`,
        property: propertyName,
      });
    }
  }

  if (isDeprecatedProperty(propertyName)) {
    issues.push({
      severity: 'warning',
      code: IssueCode.DEPRECATED_PROPERTY,
      message: `The property "${propertyName}" is deprecated in Schema.org.`,
      path: `${entityPath}.${propertyName}`,
      property: propertyName,
    });
  }

  return issues;
}
