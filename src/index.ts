// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

export type {
  ValidateOptions,
  ValidationResult,
  ValidatedEntity,
  ValidatedProperty,
  ValidationIssue,
  ValidationSummary,
  PropertyValue,
  SchemaFormat,
} from './types.js';

export { IssueCode } from './types.js';

export { validate, validateMarkup, validateJsonLd, validateBatch } from './validate/index.js';
