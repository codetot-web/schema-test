// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { validateMarkup } from '../../src/validate/index.js';

const FIXTURES_DIR = join(import.meta.dirname ?? __dirname, 'fixtures');

interface ExpectedResult {
  isValid: boolean;
  entities: ExpectedEntity[];
  errorCount: number;
  warningCount: number;
}

interface ExpectedEntity {
  types: string[];
  format: string;
  errors: { code: string; severity?: string }[];
  warnings: { code: string; property?: string }[];
}

function getFixtures(): string[] {
  const files = readdirSync(FIXTURES_DIR);
  return files
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));
}

describe('Accuracy Tests', () => {
  const fixtures = getFixtures();

  for (const fixtureName of fixtures) {
    it(`accuracy: ${fixtureName}`, () => {
      const html = readFileSync(join(FIXTURES_DIR, `${fixtureName}.html`), 'utf-8');
      const expectedPath = join(FIXTURES_DIR, `${fixtureName}.expected.json`);
      const expected: ExpectedResult = JSON.parse(readFileSync(expectedPath, 'utf-8'));

      const result = validateMarkup(html);

      // Check isValid matches
      expect(result.isValid).toBe(expected.isValid);

      // Check entity count matches
      expect(result.entities).toHaveLength(expected.entities.length);

      // Check entity types match
      for (let i = 0; i < expected.entities.length; i++) {
        const expectedEntity = expected.entities[i]!;
        const actualEntity = result.entities[i]!;
        expect(actualEntity.types).toEqual(expectedEntity.types);
      }

      // Check error count
      expect(result.summary.errorCount).toBe(expected.errorCount);

      // Check warning count
      expect(result.summary.warningCount).toBe(expected.warningCount);
    });
  }
});
