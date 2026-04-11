// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

/**
 * SDTT-matching heuristics.
 *
 * Heuristic 1: TEXT_FOR_ENTITY
 *   When a property expects a Schema.org type but receives plain text → tolerate
 *
 * Heuristic 2: URL_FOR_ENTITY
 *   When a property expects a type but receives a URL string → tolerate
 *
 * Heuristic 3: STRING_FOR_NUMBER
 *   "42" for Number → accept
 *
 * Heuristic 4: STRING_FOR_BOOLEAN
 *   "true"/"false" for Boolean → accept
 *
 * Heuristic 5: DATE_VALIDATION
 *   ISO 8601 dates accepted, non-standard may warn
 *
 * Heuristic 6: HTTP_VS_HTTPS_CONTEXT
 *   Both http:// and https://schema.org accepted as @context
 *
 * These heuristics are implemented directly in value-checker.ts.
 * This module provides utility functions for specific checks.
 */

const ISO_8601_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_8601_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const ISO_8601_TIME = /^\d{2}:\d{2}/;

/** Check if a string looks like a URL */
export function isUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

/** Check if a string is a valid ISO 8601 date */
export function isIso8601Date(value: string): boolean {
  return ISO_8601_DATE.test(value);
}

/** Check if a string is a valid ISO 8601 datetime */
export function isIso8601DateTime(value: string): boolean {
  return ISO_8601_DATETIME.test(value);
}

/** Check if a string is a valid ISO 8601 time */
export function isIso8601Time(value: string): boolean {
  return ISO_8601_TIME.test(value);
}

/** Check if a string is numeric */
export function isNumericString(value: string): boolean {
  return !isNaN(Number(value)) && value.trim().length > 0;
}

/** Check if a string is a boolean string */
export function isBooleanString(value: string): boolean {
  const lower = value.toLowerCase();
  return lower === 'true' || lower === 'false';
}
