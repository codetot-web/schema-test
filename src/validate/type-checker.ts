// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { IssueCode, type ValidationIssue } from '../types.js';
import { isKnownType, isDeprecatedType } from '../vocab/types.js';

/**
 * Validate the @type(s) of an entity against the Schema.org vocabulary.
 */
export function checkTypes(types: string[], entityPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (types.length === 0) {
    issues.push({
      severity: 'error',
      code: IssueCode.MISSING_TYPE,
      message: 'Missing @type — every Schema.org entity must have a type.',
      path: entityPath,
    });
    return issues;
  }

  for (const typeName of types) {
    if (!isKnownType(typeName)) {
      issues.push({
        severity: 'error',
        code: IssueCode.UNKNOWN_TYPE,
        message: `The type "${typeName}" is not recognized by Schema.org.`,
        path: entityPath,
        type: typeName,
      });
    } else if (isDeprecatedType(typeName)) {
      issues.push({
        severity: 'warning',
        code: IssueCode.DEPRECATED_TYPE,
        message: `The type "${typeName}" is deprecated in Schema.org.`,
        path: entityPath,
        type: typeName,
      });
    }
  }

  return issues;
}
