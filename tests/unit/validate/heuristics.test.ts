// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import {
  isUrl,
  isIso8601Date,
  isIso8601DateTime,
  isIso8601Time,
  isNumericString,
  isBooleanString,
} from '../../../src/validate/heuristics.js';

describe('Heuristics', () => {
  describe('isUrl', () => {
    it('detects http URLs', () => {
      expect(isUrl('http://example.com')).toBe(true);
    });
    it('detects https URLs', () => {
      expect(isUrl('https://example.com/path')).toBe(true);
    });
    it('rejects non-URLs', () => {
      expect(isUrl('not a url')).toBe(false);
      expect(isUrl('ftp://example.com')).toBe(false);
    });
  });

  describe('isIso8601Date', () => {
    it('accepts valid dates', () => {
      expect(isIso8601Date('2024-01-15')).toBe(true);
      expect(isIso8601Date('2024-12-31')).toBe(true);
    });
    it('rejects invalid formats', () => {
      expect(isIso8601Date('01/15/2024')).toBe(false);
      expect(isIso8601Date('2024')).toBe(false);
      expect(isIso8601Date('not a date')).toBe(false);
    });
  });

  describe('isIso8601DateTime', () => {
    it('accepts valid datetimes', () => {
      expect(isIso8601DateTime('2024-01-15T10:00:00')).toBe(true);
      expect(isIso8601DateTime('2024-01-15T10:00:00Z')).toBe(true);
      expect(isIso8601DateTime('2024-01-15T10:00:00-05:00')).toBe(true);
    });
    it('rejects plain dates', () => {
      expect(isIso8601DateTime('2024-01-15')).toBe(false);
    });
  });

  describe('isIso8601Time', () => {
    it('accepts valid times', () => {
      expect(isIso8601Time('10:00')).toBe(true);
      expect(isIso8601Time('23:59:59')).toBe(true);
    });
    it('rejects non-times', () => {
      expect(isIso8601Time('ten oclock')).toBe(false);
    });
  });

  describe('isNumericString', () => {
    it('accepts numeric strings', () => {
      expect(isNumericString('42')).toBe(true);
      expect(isNumericString('3.14')).toBe(true);
      expect(isNumericString('-7')).toBe(true);
      expect(isNumericString('0')).toBe(true);
    });
    it('rejects non-numeric strings', () => {
      expect(isNumericString('abc')).toBe(false);
      expect(isNumericString('')).toBe(false);
    });
  });

  describe('isBooleanString', () => {
    it('accepts boolean strings', () => {
      expect(isBooleanString('true')).toBe(true);
      expect(isBooleanString('false')).toBe(true);
      expect(isBooleanString('True')).toBe(true);
      expect(isBooleanString('FALSE')).toBe(true);
    });
    it('rejects non-boolean strings', () => {
      expect(isBooleanString('yes')).toBe(false);
      expect(isBooleanString('1')).toBe(false);
    });
  });
});
